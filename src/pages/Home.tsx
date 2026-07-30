import { Link } from 'react-router-dom'
import styles from './Home.module.css'

const menu = [
  {
    to: '/situation',
    emoji: '🧩',
    title: '상황추론',
    desc: '그림 속 상황을 보고 알맞은 답을 찾아요',
    color: 'var(--color-pink)',
    bg: 'var(--color-pink-soft)',
  },
  {
    to: '/story',
    emoji: '📖',
    title: '내용이해',
    desc: '이야기를 듣거나 읽고 문제를 풀어요',
    color: 'var(--color-blue)',
    bg: 'var(--color-blue-soft)',
  },
  {
    to: '/conversation',
    emoji: '💬',
    title: '대화추론',
    desc: '대화를 보고 빈칸에 알맞은 말을 골라요',
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-soft)',
  },
  {
    to: '/crossword',
    emoji: '🔤',
    title: '낱말퀴즈',
    desc: '힌트를 보고 낱말 퍼즐을 완성해요',
    color: 'var(--color-purple)',
    bg: 'var(--color-purple-soft)',
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.logo}>🌱</div>
        <h1 className={styles.title}>자람토리</h1>
        <p className={styles.subtitle}>생각이 자라고, 마음이 자라는 놀이터</p>
      </header>

      <div className={styles.grid}>
        {menu.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={styles.card}
            style={{ background: item.bg }}
          >
            <span className={styles.cardEmoji}>{item.emoji}</span>
            <span className={styles.cardTitle} style={{ color: item.color }}>
              {item.title}
            </span>
            <span className={styles.cardDesc}>{item.desc}</span>
          </Link>
        ))}
      </div>

      <Link to="/admin" className={styles.adminLink}>
        관리자
      </Link>
    </div>
  )
}
