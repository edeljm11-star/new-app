import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './admin.module.css'

const menu = [
  { to: '/admin/situations', emoji: '🧩', title: '상황추론 관리' },
  { to: '/admin/stories', emoji: '📖', title: '내용이해 관리' },
  { to: '/admin/conversations', emoji: '💬', title: '대화추론 관리' },
  { to: '/admin/crossword', emoji: '🔤', title: '낱말퀴즈 관리' },
]

export default function AdminHome() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink} aria-label="홈으로 가기">
          ⬅
        </Link>
        <h1 className={styles.title}>관리자</h1>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div className={styles.grid}>
        {menu.map((item) => (
          <Link key={item.to} to={item.to} className={styles.card}>
            <span className={styles.cardEmoji}>{item.emoji}</span>
            <span className={styles.cardTitle}>{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
