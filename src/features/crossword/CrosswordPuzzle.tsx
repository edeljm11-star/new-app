import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { listPuzzles, type CrosswordPuzzle as CrosswordPuzzleType } from './api'
import CrosswordBoard from './CrosswordBoard'
import styles from './CrosswordPuzzle.module.css'

export default function CrosswordPuzzle() {
  const [puzzles, setPuzzles] = useState<CrosswordPuzzleType[] | null>(null)
  const [puzzleId, setPuzzleId] = useState<string | null>(null)

  useEffect(() => {
    listPuzzles().then(setPuzzles)
  }, [])

  const puzzle = puzzles?.find((p) => p.id === puzzleId) ?? null

  return (
    <Layout title="낱말퀴즈" accentColor="var(--color-purple)">
      {puzzles === null ? (
        <p className={styles.intro}>불러오는 중이에요...</p>
      ) : puzzle ? (
        <CrosswordBoard key={puzzle.id} puzzle={puzzle} onExit={() => setPuzzleId(null)} />
      ) : puzzles.length === 0 ? (
        <p className={styles.intro}>아직 낱말퀴즈가 없어요. 관리자 화면에서 추가해주세요.</p>
      ) : (
        <div className={styles.list}>
          <p className={styles.intro}>풀고 싶은 낱말퀴즈를 골라보세요</p>
          {puzzles.map((p) => (
            <button key={p.id} type="button" className={styles.puzzleCard} onClick={() => setPuzzleId(p.id)}>
              <span className={styles.puzzleEmoji}>🔤</span>
              <span className={styles.puzzleTitle}>{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </Layout>
  )
}
