import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  title: string
  accentColor?: string
  // Where the header's back arrow goes. Defaults to home, but a screen
  // that sits one level below a list (e.g. an open puzzle) should pass its
  // list's own path here, so the button, the in-page exit button, and the
  // device/browser back gesture all agree on the same "one step back".
  backTo?: string
  children: ReactNode
}

export default function Layout({ title, accentColor, backTo = '/', children }: LayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header} style={{ background: accentColor }}>
        <Link to={backTo} className={styles.backButton} aria-label="뒤로 가기">
          ⬅
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.spacer} aria-hidden="true" />
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
