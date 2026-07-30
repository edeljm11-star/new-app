import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import BigButton from '../../components/BigButton'
import type { CrosswordPuzzle } from './api'
import styles from './CrosswordBoard.module.css'

type HintMode = 'text' | 'emoji'

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

function findCells(puzzle: CrosswordPuzzle) {
  const cells: { row: number; col: number }[] = []
  puzzle.grid.forEach((rowArr, row) => {
    rowArr.forEach((cell, col) => {
      if (cell !== null) cells.push({ row, col })
    })
  })
  return cells
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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const numberMap = useMemo(() => {
    const map: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    for (const word of puzzle.words) {
      map[word.row][word.col] = word.number
    }
    return map
  }, [puzzle, rows, cols])

  const orderedCells = useMemo(() => findCells(puzzle), [puzzle])

  const isComplete =
    checked &&
    puzzle.grid.every((rowArr, r) =>
      rowArr.every((cell, c) => cell === null || answers[r][c] === cell),
    )

  function focusCell(row: number, col: number) {
    inputRefs.current[`${row}-${col}`]?.focus()
  }

  function moveToAdjacent(row: number, col: number, direction: 1 | -1) {
    const idx = orderedCells.findIndex((c) => c.row === row && c.col === col)
    const target = orderedCells[idx + direction]
    if (target) focusCell(target.row, target.col)
  }

  function handleChange(row: number, col: number, value: string) {
    const char = value.slice(-1)
    setAnswers((prev) => {
      const next = prev.map((r) => [...r])
      next[row][col] = char
      return next
    })
    setChecked(false)
    if (char) moveToAdjacent(row, col, 1)
  }

  function handleKeyDown(row: number, col: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !answers[row][col]) {
      moveToAdjacent(row, col, -1)
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
    setHintModes((prev) => ({ ...prev, [key]: prev[key] === 'emoji' ? 'text' : 'emoji' }))
  }

  const across = puzzle.words.filter((w) => w.direction === 'across')
  const down = puzzle.words.filter((w) => w.direction === 'down')

  return (
    <div>
      <div className={styles.board}>
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
                  maxLength={1}
                  inputMode="text"
                  aria-label={`${r}행 ${c}열`}
                  onChange={(e) => handleChange(r, c, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(r, c, e)}
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
        <ClueGroup label="가로" words={across} hintModes={hintModes} onToggle={toggleHint} />
        <ClueGroup label="세로" words={down} hintModes={hintModes} onToggle={toggleHint} />
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
}: {
  label: string
  words: CrosswordPuzzle['words']
  hintModes: Record<string, HintMode>
  onToggle: (key: string) => void
}) {
  return (
    <div className={styles.clueGroup}>
      <h3 className={styles.clueGroupTitle}>{label}</h3>
      {words.map((word) => {
        const key = `${word.direction}-${word.number}`
        const mode = hintModes[key] ?? 'text'
        return (
          <div key={key} className={styles.clueItem}>
            <span className={styles.clueNumber}>{word.number}.</span>
            <span className={styles.clueHint}>{mode === 'text' ? word.hintText : word.hintEmoji}</span>
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
