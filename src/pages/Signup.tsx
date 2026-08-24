import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

function translateError(message: string): string {
  if (message.includes('already registered')) return '이미 가입된 이메일이에요. 로그인해주세요.'
  if (message.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요.'
  if (message.includes('valid email')) return '올바른 이메일 주소를 입력해주세요.'
  if (message.includes('rate limit')) return '잠시 후 다시 시도해주세요. (요청이 너무 많아요)'
  return '회원가입 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.'
}

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않아요.')
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (error) {
      setError(translateError(error.message))
      return
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('이미 가입된 이메일이에요. 로그인해주세요.')
      return
    }
    // Email confirmation is off, so signUp already returns a session — go
    // straight in. If it's ever turned back on, fall back to the "check
    // your email" screen instead of leaving the user stuck.
    if (data.session) {
      navigate('/')
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
            {email}로 확인 메일을 보냈어요. 메일 속 링크를 눌러 인증을 마치면 로그인할 수 있어요.
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
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>자람토리와 함께 시작해요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-password-confirm">비밀번호 확인</label>
          <input
            id="signup-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <button type="submit" className={styles.submitButton} disabled={submitting}>
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className={styles.switchLink}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  )
}
