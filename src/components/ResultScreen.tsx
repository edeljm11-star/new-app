import { Link } from 'react-router-dom'
import BigButton from './BigButton'
import styles from './ResultScreen.module.css'

interface ResultScreenProps {
  score: number
  total: number
  onRetry: () => void
  // When provided, replaces the "홈으로 가기" link with a button that goes
  // back to this quiz's own list instead (the app header's back arrow still
  // reaches home from there, so nothing is lost).
  onExit?: () => void
  exitLabel?: string
}

function getMessage(ratio: number) {
  if (ratio === 1) return { emoji: '🏆', text: '완벽해요! 최고예요!' }
  if (ratio >= 0.6) return { emoji: '🎉', text: '정말 잘했어요!' }
  return { emoji: '🌱', text: '잘 하고 있어요, 다시 도전해봐요!' }
}

export default function ResultScreen({ score, total, onRetry, onExit, exitLabel = '다른 문제 고르기' }: ResultScreenProps) {
  const ratio = total === 0 ? 0 : score / total
  const { emoji, text } = getMessage(ratio)

  return (
    <div className={styles.wrap}>
      <div className={styles.emoji}>{emoji}</div>
      <p className={styles.message}>{text}</p>
      <p className={styles.score}>
        {total}문제 중 <strong>{score}</strong>개 맞혔어요
      </p>
      <div className={styles.actions}>
        <BigButton onClick={onRetry}>다시 풀기</BigButton>
        {onExit ? (
          <button type="button" className={styles.homeLink} onClick={onExit}>
            {exitLabel}
          </button>
        ) : (
          <Link to="/" className={styles.homeLink}>
            홈으로 가기
          </Link>
        )}
      </div>
    </div>
  )
}
