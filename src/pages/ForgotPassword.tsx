import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const redirectTo = `${window.location.origin}${window.location.pathname}#/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setSubmitting(false)
    if (error) {
      setError('요청 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>📩</div>
          <h1 className={styles.title}>이메일을 확인해주세요</h1>
        </header>
        <div className={styles.form}>
          <p className={styles.successText}>
            {email}로 비밀번호 재설정 링크를 보냈어요. 메일 속 링크를 눌러 새 비밀번호를 설정해주세요.
          </p>
        </div>
        <p className={styles.switchLink}>
          <Link to="/login">로그인 화면으로 가기</Link>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>🌷</div>
        <h1 className={styles.title}>비밀번호 찾기</h1>
        <p className={styles.subtitle}>가입한 이메일로 재설정 링크를 보내드려요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="forgot-email">이메일</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? '전송 중...' : '재설정 링크 보내기'}
        </button>
      </form>

      <p className={styles.switchLink}>
        <Link to="/login">로그인 화면으로 가기</Link>
      </p>
    </div>
  )
}
