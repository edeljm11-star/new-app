import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProfiles, type Profile } from '../../features/users/api'
import styles from './admin.module.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function UsersAdmin() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null)

  useEffect(() => {
    listProfiles().then(setProfiles)
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin" className={styles.backLink} aria-label="관리자 홈으로 가기">
          ⬅
        </Link>
        <h1 className={styles.title}>회원 관리</h1>
      </header>

      {profiles === null ? (
        <p className={styles.empty}>불러오는 중이에요...</p>
      ) : profiles.length === 0 ? (
        <p className={styles.empty}>아직 가입한 회원이 없어요.</p>
      ) : (
        <>
          <p className={styles.hint}>총 {profiles.length}명이 가입했어요.</p>
          <div className={styles.list}>
            {profiles.map((p) => (
              <div key={p.id} className={styles.row}>
                <span className={styles.rowTitle}>{p.email}</span>
                <span className={styles.hint}>{formatDate(p.createdAt)} 가입</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
