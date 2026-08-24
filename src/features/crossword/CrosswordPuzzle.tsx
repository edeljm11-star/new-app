import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import LoadError from '../../components/LoadError'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listPuzzles, type CrosswordPuzzle as CrosswordPuzzleType } from './api'
import { groupByCategory } from './grouping'
import CrosswordBoard from './CrosswordBoard'
import styles from './CrosswordPuzzle.module.css'

export default function CrosswordPuzzle() {
  const [puzzles, setPuzzles] = useState<CrosswordPuzzleType[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const { puzzleId } = useParams<{ puzzleId?: string }>()
  const navigate = useNavigate()
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('crosswordAnswers')

  function load() {
    setLoadError(false)
    setPuzzles(null)
    listPuzzles()
      .then(setPuzzles)
      .catch(() => setLoadError(true))
  }

  useEffect(() => {
    load()
  }, [])

  const puzzle = puzzles?.find((p) => p.id === puzzleId) ?? null
  const groups = useMemo(() => (puzzles ? groupByCategory(puzzles) : []), [puzzles])

  return (
    <Layout title="낱말퀴즈" accentColor="var(--color-purple)" backTo={puzzle ? '/crossword' : '/'}>
      {loadError ? (
        <LoadError onRetry={load} />
      ) : puzzles === null ? (
        <p className={styles.intro}>불러오는 중이에요...</p>
      ) : puzzle ? (
        <CrosswordBoard
          key={puzzle.id}
          puzzle={puzzle}
          onExit={() => navigate('/crossword')}
          onComplete={() => recordAnswer(puzzle.id, 1)}
        />
      ) : puzzles.length === 0 ? (
        <p className={styles.intro}>아직 낱말퀴즈가 없어요. 관리자 화면에서 추가해주세요.</p>
      ) : (
        <div className={styles.list}>
          <p className={styles.intro}>풀고 싶은 낱말퀴즈를 골라보세요 ({puzzles.length}개)</p>
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
                  <div className={styles.numberGrid}>
                    {items.map((p, i) => {
                      const done = answers[p.id] !== undefined
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={[styles.numberButton, done ? styles.numberButtonDone : ''].join(' ')}
                          onClick={() => navigate(`/crossword/${p.id}`)}
                          aria-label={`${i + 1}번 낱말퀴즈`}
                        >
                          {i + 1}
                          {done && <span className={styles.doneBadge}>✓</span>}
                        </button>
                      )
                    })}
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
