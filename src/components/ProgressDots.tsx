import styles from './ProgressDots.module.css'

interface ProgressDotsProps {
  total: number
  current: number
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className={styles.row} role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={[styles.dot, i <= current ? styles.filled : ''].join(' ')}
        />
      ))}
    </div>
  )
}
