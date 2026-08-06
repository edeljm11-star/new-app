import {
  useMemo,
  useRef,
  useState,
  type CompositionEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import BigButton from '../../components/BigButton'
import type { CrosswordPuzzle } from './api'
import styles from './CrosswordBoard.module.css'

type HintMode = 'text' | 'emoji'

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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

  function focusCell(row: number, col: number) {
    // Deferred a tick so the browser fully finishes handling whatever event
    // (compositionend, keydown) triggered the move before we shift focus.
    // Moving focus synchronously mid-event can make Android IMEs (notably
    // Samsung Keyboard) start the next cell's composition before finishing
    // teardown of the previous one, dropping the next cell's first
    // keystroke. Real typing speed leaves ample room for this to settle.
    setTimeout(() => {
      inputRefs.current[`${row}-${col}`]?.focus()
    }, 0)
  }

  function moveToAdjacent(row: number, col: number, delta: 1 | -1) {
    const nextRow = activeDirection === 'down' ? row + delta : row
    const nextCol = activeDirection === 'across' ? col + delta : col
    if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) return
    if (puzzle.grid[nextRow][nextCol] === null) return
    focusCell(nextRow, nextCol)
  }

  function handleFocus(row: number, col: number) {
    const dirs = cellDirections[row][col]
    setActiveDirection((prev) => (dirs.includes(prev) ? prev : (dirs[0] ?? prev)))
  }

  // Tapping a cell that already has focus doesn't fire a new focus event, so
  // this is how a second tap on an across/down intersection (e.g. the shared
  // start of "지우개" and "지도") switches direction instead of doing nothing.
  function handlePointerDown(row: number, col: number, e: ReactMouseEvent<HTMLInputElement>) {
    const alreadyFocused = document.activeElement === e.currentTarget
    if (!alreadyFocused) return
    const dirs = cellDirections[row][col]
    if (dirs.length < 2) return
    setActiveDirection((prev) => dirs.find((d) => d !== prev) ?? prev)
  }

  function selectWord(word: CrosswordPuzzle['words'][number]) {
    setActiveDirection(word.direction)
    focusCell(word.row, word.col)
  }

  function handleChange(row: number, col: number, value: string, advance: boolean) {
    const char = value.slice(-1)
    setAnswers((prev) => {
      const next = prev.map((r) => [...r])
      next[row][col] = char
      return next
    })
    setChecked(false)
    if (char && advance) moveToAdjacent(row, col, 1)
  }

  function handleKeyDown(row: number, col: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !answers[row][col]) {
      moveToAdjacent(row, col, -1)
    }
  }

  function handleCompositionEnd(row: number, col: number, e: CompositionEvent<HTMLInputElement>) {
    // Read the live DOM value rather than e.data: some mobile browsers
    // (Samsung Internet) deliver an unreliable/empty CompositionEvent.data,
    // which would silently erase whatever the user just typed.
    handleChange(row, col, (e.target as HTMLInputElement).value, true)
  }

  function handleCheck() {
    setChecked(true)
  }

  function handleReset() {
    setAnswers(emptyGrid(rows, cols))
    setChecked(false)
  }

  function toggleHint(key: string) {
    setHintModes((prev) => ({ ...prev, [key]: prev[key] === 'emoji' ? 'text' : 'emoji' }))
  }

  const across = puzzle.words.filter((w) => w.direction === 'across')
  const down = puzzle.words.filter((w) => w.direction === 'down')

  return (
    <div>
      <div className={styles.board} style={{ '--cols': cols } as React.CSSProperties}>
        {puzzle.grid.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            if (cell === null) return <div key={`${r}-${c}`} className={styles.blockCell} />
            const value = answers[r][c]
            const isCorrect = checked && value === cell
            const isWrong = checked && value !== '' && value !== cell
            const number = numberMap[r][c]
            return (
              <div key={`${r}-${c}`} className={styles.cellWrap}>
                {number !== null && <span className={styles.cellNumber}>{number}</span>}
                <input
                  ref={(el) => {
                    inputRefs.current[`${r}-${c}`] = el
                  }}
                  className={[
                    styles.cellInput,
                    isCorrect ? styles.cellCorrect : '',
                    isWrong ? styles.cellWrong : '',
                  ].join(' ')}
                  value={value}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`${r}행 ${c}열`}
                  onChange={(e) => {
                    // Some mobile IMEs (Samsung Keyboard on Samsung Internet)
                    // never deliver a usable compositionend, so onChange is
                    // the only reliable path there — keep committing on every
                    // change, but only auto-advance once composition (if any)
                    // has finished.
                    const composing = (e.nativeEvent as InputEvent).isComposing
                    handleChange(r, c, e.target.value, !composing)
                  }}
                  onCompositionEnd={(e) => handleCompositionEnd(r, c, e)}
                  onKeyDown={(e) => handleKeyDown(r, c, e)}
                  onFocus={() => handleFocus(r, c)}
                  onMouseDown={(e) => handlePointerDown(r, c, e)}
                />
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
              <span className={styles.clueHint}>{mode === 'text' ? word.hintText : word.hintEmoji}</span>
            </button>
            <button
              type="button"
              className={styles.hintToggle}
              onClick={() => onToggle(key)}
              aria-label="힌트 방식 바꾸기"
            >
              {mode === 'text' ? '🖼️' : '💬'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
