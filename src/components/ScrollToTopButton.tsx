import { useLocation } from 'react-router-dom'
import styles from './ScrollToTopButton.module.css'

// Shown on every screen except the home screen (which is short enough that
// scrolling back up is never an issue there). Always visible rather than
// scroll-triggered, per user preference.
export default function ScrollToTopButton() {
  const location = useLocation()
  if (location.pathname === '/') return null

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}
