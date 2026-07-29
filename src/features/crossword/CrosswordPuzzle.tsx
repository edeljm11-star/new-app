import { useState } from 'react'
import Layout from '../../components/Layout'
import { puzzles } from './data'
import CrosswordBoard from './CrosswordBoard'
import styles from './CrosswordPuzzle.module.css'

export default function CrosswordPuzzle() {
  const [puzzleId, setPuzzleId] = useState<string | null>(null)
  const puzzle = puzzles.find((p) => p.id === puzzleId) ?? null

  return (
    <Layout title="낱말퀴즈" accentColor="var(--color-purple)">
      {puzzle ? (
        <CrosswordBoard key={puzzle.id} puzzle={puzzle} onExit={() => setPuzzleId(null)} />
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
