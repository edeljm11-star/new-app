import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

function translateError(message: string): string {
  if (message.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요.'
  return '비밀번호 변경 중 문제가 생겼어요. 다시 시도해주세요.'
}

// Reached from the email link Supabase sends after ForgotPassword's
// resetPasswordForEmail. The link carries a one-time `code` query param
// (PKCE flow -- see lib/supabase.ts) that this page exchanges for a
// short-lived session, just long enough to call updateUser with a new
// password.
export default function ResetPassword() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function establishSession() {
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        // Drop the one-time code from the URL so refreshing this page
        // doesn't retry it (it's already spent either way).
        window.history.replaceState(null, '', window.location.pathname + window.location.hash)
        setStatus(error ? 'invalid' : 'ready')
        return
      }

      // Implicit-flow recovery links land as "#access_token=...&type=recovery"
      // appended after HashRouter's own "#/reset-password" path -- i.e. a
      // second, literal "#" inside window.location.hash, not a real second
      // fragment. Pull the tokens out with a plain match rather than trying
      // to parse the whole hash as a URL/query string.
      const hash = window.location.hash
      const accessToken = hash.match(/access_token=([^&]+)/)?.[1]
      const refreshToken = hash.match(/refresh_token=([^&]+)/)?.[1]
      if (accessToken && refreshToken) {
        // Set explicitly (not just relying on the client's own URL
        // auto-detection) so this always wins over any stale session
        // already sitting in localStorage from a previous account.
        const { error } = await supabase.auth.setSession({
          access_token: decodeURIComponent(accessToken),
          refresh_token: decodeURIComponent(refreshToken),
        })
        window.history.replaceState(null, '', window.location.pathname + '#/reset-password')
        setStatus(error ? 'invalid' : 'ready')
        return
      }

      const { data } = await supabase.auth.getSession()
      setStatus(data.session ? 'ready' : 'invalid')
    }
    establishSession()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않아요.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setError(translateError(error.message))
      return
    }
    setDone(true)
  }

  if (status === 'checking') return null

  if (status === 'invalid') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>⚠️</div>
          <h1 className={styles.title}>링크가 만료됐어요</h1>
        </header>
        <div className={styles.form}>
          <p className={styles.successText}>비밀번호 재설정 링크가 만료됐거나 이미 사용됐어요. 다시 요청해주세요.</p>
        </div>
        <p className={styles.switchLink}>
          <Link to="/forgot-password">다시 요청하기</Link>
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logo}>✅</div>
          <h1 className={styles.title}>비밀번호가 변경됐어요</h1>
        </header>
        <div className={styles.form}>
          <p className={styles.successText}>새 비밀번호로 로그인해주세요.</p>
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
        <h1 className={styles.title}>새 비밀번호 설정</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="new-password">새 비밀번호</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="new-password-confirm">비밀번호 확인</label>
          <input
            id="new-password-confirm"
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
          {submitting ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}
