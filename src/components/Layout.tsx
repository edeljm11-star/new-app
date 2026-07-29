import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  title: string
  accentColor?: string
  children: ReactNode
}

export default function Layout({ title, accentColor, children }: LayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header} style={{ background: accentColor }}>
        <Link to="/" className={styles.backButton} aria-label="홈으로 가기">
          ⬅
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.spacer} aria-hidden="true" />
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
