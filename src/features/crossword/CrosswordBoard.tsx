import {
  useRef,
  useMemo,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from 'react'
import BigButton from '../../components/BigButton'
import { toChosung } from '../../lib/hangul'
import type { CrosswordPuzzle } from './api'
import styles from './CrosswordBoard.module.css'

type HintMode = 'text' | 'chosung' | 'emoji'
const NEXT_HINT_MODE: Record<HintMode, HintMode> = { text: 'chosung', chosung: 'emoji', emoji: 'text' }
// Icon shown represents what tapping the button switches *to*, matching how
// the two-mode toggle worked before (icon = the other mode's symbol).
const HINT_MODE_ICON: Record<HintMode, string> = { text: '🔤', chosung: '🖼️', emoji: '💬' }

interface Cell {
  row: number
  col: number
}

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

interface CrosswordBoardProps {
  puzzle: CrosswordPuzzle
  onExit: () => void
}

export default function CrosswordBoard({ puzzle, onExit }: CrosswordBoardProps) {
  const rows = puzzle.grid.length
  const cols = puzzle.grid[0].length

  const [answers, setAnswers] = useState<string[][]>(() => emptyGrid(rows, cols))
  const [checked, setChecked] = useState(false)
  const [hintModes, setHintModes] = useState<Record<string, HintMode>>({})
  const [activeDirection, setActiveDirection] = useState<'across' | 'down'>('across')
  const [activeCell, setActiveCell] = useState<Cell | null>(null)
  // The syllable currently being assembled by the IME, shown live in the
  // active cell. Kept separate from `answers` so displaying it never means
  // writing to the hidden input's own value mid-composition — that's what
  // corrupted Hangul composition when cells were individually controlled
  // inputs.
  const [preview, setPreview] = useState('')
  // A single persistent input captures every keystroke for the whole board.
  // Cells themselves are plain divs — tapping one just moves this pointer.
  // Because the input never loses focus while solving a word, typing never
  // triggers a focus transition mid-keystroke, which is what was corrupting
  // Hangul composition on Android (Samsung Keyboard confirmed): the OS was
  // starting a new cell's composition before finishing teardown of the
  // previous cell's, dropping keystrokes.
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const numberMap = useMemo(() => {
    const map: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    for (const word of puzzle.words) {
      map[word.row][word.col] = word.number
    }
    return map
  }, [puzzle, rows, cols])

  // Cells at word intersections belong to both an across and a down word,
  // so auto-advance needs to know which word is actually being typed.
  const cellDirections = useMemo(() => {
    const map: ('across' | 'down')[][][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => []),
    )
    for (const word of puzzle.words) {
      for (let i = 0; i < word.length; i++) {
        const r = word.direction === 'down' ? word.row + i : word.row
        const c = word.direction === 'across' ? word.col + i : word.col
        if (!map[r][c].includes(word.direction)) map[r][c].push(word.direction)
      }
    }
    return map
  }, [puzzle, rows, cols])

  const isComplete =
    checked &&
    puzzle.grid.every((rowArr, r) =>
      rowArr.every((cell, c) => cell === null || answers[r][c] === cell),
    )

  function focusHiddenInput() {
    if (!hiddenInputRef.current) return
    hiddenInputRef.current.value = ''
    hiddenInputRef.current.focus()
    setPreview('')
  }

  // Tapping a cell that's already active switches direction when it sits on
  // an across/down intersection (e.g. the shared start of "지우개" and
  // "지도"), otherwise picks whichever direction the tap doesn't already
  // match — this mirrors what focus + a second tap used to do back when
  // each cell was its own input.
  function selectCell(row: number, col: number) {
    const dirs = cellDirections[row][col]
    const isSameCell = activeCell?.row === row && activeCell?.col === col
    if (isSameCell && dirs.length >= 2) {
      setActiveDirection((prev) => dirs.find((d) => d !== prev) ?? prev)
    } else {
      setActiveDirection((prev) => (dirs.includes(prev) ? prev : (dirs[0] ?? prev)))
    }
    setActiveCell({ row, col })
    focusHiddenInput()
  }

  function selectWord(word: CrosswordPuzzle['words'][number]) {
    setActiveDirection(word.direction)
    setActiveCell({ row: word.row, col: word.col })
    focusHiddenInput()
  }

  function moveActiveCell(delta: 1 | -1) {
    setActiveCell((current) => {
      if (!current) return current
      const nextRow = activeDirection === 'down' ? current.row + delta : current.row
      const nextCol = activeDirection === 'across' ? current.col + delta : current.col
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) return current
      if (puzzle.grid[nextRow][nextCol] === null) return current
      return { row: nextRow, col: nextCol }
    })
  }

  function commitChar(char: string) {
    if (!activeCell) return
    const { row, col } = activeCell
    setAnswers((prev) => {
      const next = prev.map((r) => [...r])
      next[row][col] = char
      return next
    })
    setChecked(false)
    if (char) moveActiveCell(1)
  }

  function handleHiddenChange(e: ChangeEvent<HTMLInputElement>) {
    // Committing (writing to `answers`) mid-composition would force this
    // input to re-render while Android is still assembling a Hangul
    // syllable, corrupting it — only commit once composition finishes.
    // Showing a live preview is safe, though: it never touches the hidden
    // input's own value, just a separate bit of state rendered elsewhere.
    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing) {
      setPreview(e.target.value)
      return
    }
    const char = e.target.value.slice(-1)
    e.target.value = ''
    setPreview('')
    if (char) commitChar(char)
  }

  function handleHiddenCompositionEnd(e: CompositionEvent<HTMLInputElement>) {
    // Read the live DOM value rather than e.data: some mobile browsers
    // (Samsung Internet) deliver an unreliable/empty CompositionEvent.data,
    // which would silently erase whatever the user just typed.
    const target = e.target as HTMLInputElement
    const char = target.value.slice(-1)
    target.value = ''
    setPreview('')
    if (char) commitChar(char)
  }

  function handleHiddenKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace' || e.nativeEvent.isComposing || !activeCell) return
    setPreview('')
    const { row, col } = activeCell
    if (answers[row][col]) {
      setAnswers((prev) => {
        const next = prev.map((r) => [...r])
        next[row][col] = ''
        return next
      })
      setChecked(false)
    } else {
      moveActiveCell(-1)
    }
  }

  function handleCheck() {
    setChecked(true)
  }

  function handleReset() {
    setAnswers(emptyGrid(rows, cols))
    setChecked(false)
  }

  function toggleHint(key: string) {
    setHintModes((prev) => ({ ...prev, [key]: NEXT_HINT_MODE[prev[key] ?? 'text'] }))
  }

  const across = puzzle.words.filter((w) => w.direction === 'across')
  const down = puzzle.words.filter((w) => w.direction === 'down')

  return (
    <div>
      <input
        ref={hiddenInputRef}
        className={styles.hiddenInput}
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="정답 입력"
        onChange={handleHiddenChange}
        onCompositionEnd={handleHiddenCompositionEnd}
        onKeyDown={handleHiddenKeyDown}
      />
      <div className={styles.board} style={{ '--cols': cols } as React.CSSProperties}>
        {puzzle.grid.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            if (cell === null) return <div key={`${r}-${c}`} className={styles.blockCell} />
            const value = answers[r][c]
            const isCorrect = checked && value === cell
            const isWrong = checked && value !== '' && value !== cell
            const isActive = activeCell?.row === r && activeCell?.col === c
            const displayValue = isActive && preview ? preview.slice(-1) : value
            const number = numberMap[r][c]
            return (
              <div key={`${r}-${c}`} className={styles.cellWrap}>
                {number !== null && <span className={styles.cellNumber}>{number}</span>}
                <div
                  role="button"
                  tabIndex={-1}
                  className={[
                    styles.cellInput,
                    isActive ? styles.cellActive : '',
                    isCorrect ? styles.cellCorrect : '',
                    isWrong ? styles.cellWrong : '',
                  ].join(' ')}
                  aria-label={`${r}행 ${c}열`}
                  onClick={() => selectCell(r, c)}
                >
                  {displayValue}
                </div>
              </div>
            )
          }),
        )}
      </div>

      {isComplete && <p className={styles.completeBanner}>🎉 낱말퀴즈를 완성했어요!</p>}

      <div className={styles.buttonRow}>
        <BigButton onClick={handleCheck} color="var(--color-purple)">
          확인하기
        </BigButton>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          다시 풀기
        </button>
      </div>

      <div className={styles.clues}>
        <ClueGroup label="가로" words={across} hintModes={hintModes} onToggle={toggleHint} onSelect={selectWord} />
        <ClueGroup label="세로" words={down} hintModes={hintModes} onToggle={toggleHint} onSelect={selectWord} />
      </div>

      <button type="button" className={styles.exitLink} onClick={onExit}>
        다른 낱말퀴즈 고르기
      </button>
    </div>
  )
}

function ClueGroup({
  label,
  words,
  hintModes,
  onToggle,
  onSelect,
}: {
  label: string
  words: CrosswordPuzzle['words']
  hintModes: Record<string, HintMode>
  onToggle: (key: string) => void
  onSelect: (word: CrosswordPuzzle['words'][number]) => void
}) {
  return (
    <div className={styles.clueGroup}>
      <h3 className={styles.clueGroupTitle}>{label}</h3>
      {words.map((word) => {
        const key = `${word.direction}-${word.number}`
        const mode = hintModes[key] ?? 'text'
        return (
          <div key={key} className={styles.clueItem}>
            <button
              type="button"
              className={styles.clueSelect}
              onClick={() => onSelect(word)}
            >
              <span className={styles.clueNumber}>{word.number}.</span>
              <span className={styles.clueHint}>
                {mode === 'text' ? word.hintText : mode === 'chosung' ? toChosung(word.answer) : word.hintEmoji}
              </span>
            </button>
            <button
              type="button"
              className={styles.hintToggle}
              onClick={() => onToggle(key)}
              aria-label="힌트 방식 바꾸기"
            >
              {HINT_MODE_ICON[mode]}
            </button>
          </div>
        )
      })}
    </div>
  )
}
