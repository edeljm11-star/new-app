import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않아요.')
      return
    }
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>🌱</div>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>자람토리에서 다시 만나요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="login-email">이메일</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password">비밀번호</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className={styles.switchLink}>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </p>
    </div>
  )
}
