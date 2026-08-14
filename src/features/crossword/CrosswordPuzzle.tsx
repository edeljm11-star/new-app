import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listPuzzles, type CrosswordPuzzle as CrosswordPuzzleType } from './api'
import CrosswordBoard from './CrosswordBoard'
import styles from './CrosswordPuzzle.module.css'

// Puzzle titles that belong to the same category share a base name, e.g.
// "동물과 자연" and "동물과 자연 2" both group under "동물과 자연".
function categoryOf(title: string): string {
  return title.replace(/\s+\d+$/, '')
}

function groupByCategory(puzzles: CrosswordPuzzleType[]): [string, CrosswordPuzzleType[]][] {
  const groups = new Map<string, CrosswordPuzzleType[]>()
  for (const p of puzzles) {
    const category = categoryOf(p.title)
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category)!.push(p)
  }
  return Array.from(groups.entries())
}

export default function CrosswordPuzzle() {
  const [puzzles, setPuzzles] = useState<CrosswordPuzzleType[] | null>(null)
  const [puzzleId, setPuzzleId] = useState<string | null>(null)
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('crosswordAnswers')

  useEffect(() => {
    listPuzzles().then(setPuzzles)
  }, [])

  const puzzle = puzzles?.find((p) => p.id === puzzleId) ?? null
  const groups = useMemo(() => (puzzles ? groupByCategory(puzzles) : []), [puzzles])

  return (
    <Layout title="낱말퀴즈" accentColor="var(--color-purple)">
      {puzzles === null ? (
        <p className={styles.intro}>불러오는 중이에요...</p>
      ) : puzzle ? (
        <CrosswordBoard
          key={puzzle.id}
          puzzle={puzzle}
          onExit={() => setPuzzleId(null)}
          onComplete={() => recordAnswer(puzzle.id, 1)}
        />
      ) : puzzles.length === 0 ? (
        <p className={styles.intro}>아직 낱말퀴즈가 없어요. 관리자 화면에서 추가해주세요.</p>
      ) : (
        <div className={styles.list}>
          <p className={styles.intro}>풀고 싶은 낱말퀴즈를 골라보세요</p>
          {groups.map(([category, items]) => {
            const isOpen = openCategory === category
            return (
              <div key={category} className={styles.categoryGroup}>
                <button
                  type="button"
                  className={styles.puzzleCard}
                  aria-expanded={isOpen}
                  onClick={() => setOpenCategory((c) => (c === category ? null : category))}
                >
                  <span className={styles.puzzleEmoji}>🔤</span>
                  <span className={styles.puzzleTitle}>{category}</span>
                  <span className={styles.puzzleCount}>{items.length}개</span>
                  <span className={[styles.chevron, isOpen ? styles.chevronOpen : ''].join(' ')}>▾</span>
                </button>
                {isOpen && (
                  <div className={styles.subList}>
                    {items.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.subItem}
                        onClick={() => setPuzzleId(p.id)}
                      >
                        <span className={styles.subNumber}>{i + 1}</span>
                        <span className={styles.subTitle}>{i + 1}번 낱말퀴즈</span>
                        {answers[p.id] !== undefined && (
                          <span className={[styles.itemStatus, styles.statusDone].join(' ')}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
