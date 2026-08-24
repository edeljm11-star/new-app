import BigButton from './BigButton'
import styles from './LoadError.module.css'

interface LoadErrorProps {
  onRetry: () => void
}

// Shown in place of a quiz list when the initial data fetch fails (e.g. a
// flaky connection), so the screen doesn't just sit on "불러오는 중이에요..."
// forever with no way out.
export default function LoadError({ onRetry }: LoadErrorProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.message}>불러오는 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해주세요.</p>
      <BigButton onClick={onRetry}>다시 시도</BigButton>
    </div>
  )
}
