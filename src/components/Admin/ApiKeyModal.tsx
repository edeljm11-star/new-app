import { useEffect, useState } from 'react'
import { getGeminiApiKey, saveGeminiApiKey } from '../../lib/adminSettings'
import styles from '../../pages/Admin/admin.module.css'

interface ApiKeyModalProps {
  onClose: () => void
  // Called after a key is successfully saved, so a caller that opened this
  // modal to unblock an "AI로 만들기" click can immediately continue.
  onSaved?: (key: string) => void
}

export default function ApiKeyModal({ onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getGeminiApiKey()
      .then((existing) => setKey(existing ?? ''))
      .finally(() => setLoaded(true))
  }, [])

  async function handleSave() {
    if (!key.trim()) {
      setError('API Key를 입력해주세요.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveGeminiApiKey(key.trim())
      setSaved(true)
      onSaved?.(key.trim())
    } catch {
      setError('저장 중 문제가 생겼어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>⚙️ 인공지능(AI) API 키 설정</h2>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <p className={styles.modalText}>
          AI로 문제를 자동으로 만들려면 구글의 <strong>Gemini API 키</strong>가 필요해요. 무료로 발급받을 수 있고, 한
          번만 등록하면 이후에는 자동으로 불러와요.
        </p>

        <a
          className={styles.modalLinkButton}
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
        >
          👉 구글 AI 스튜디오에서 API 키 발급받기
        </a>

        <ol className={styles.modalSteps}>
          <li>위 버튼을 눌러 구글 AI 스튜디오로 이동합니다 (구글 로그인 필요).</li>
          <li>
            <strong>Create API key</strong> (또는 Get API key) 버튼을 클릭합니다.
          </li>
          <li>기존 프로젝트를 선택하거나 새 프로젝트를 만든 뒤 키를 생성합니다.</li>
          <li>
            생성된 키(<strong>AIzaSy...</strong>로 시작)를 복사합니다.
          </li>
          <li>이 화면으로 돌아와서 아래 입력칸에 붙여넣기 하세요.</li>
        </ol>

        <div className={styles.field}>
          <label>API Key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              setSaved(false)
            }}
            placeholder={loaded ? 'AIzaSy...' : '불러오는 중...'}
            disabled={!loaded}
            autoComplete="off"
          />
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
        {saved && !error && <p className={styles.modalSuccessText}>저장됐어요!</p>}

        <div className={styles.formActions}>
          <button type="button" className={styles.saveButton} disabled={saving || !loaded} onClick={handleSave}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
