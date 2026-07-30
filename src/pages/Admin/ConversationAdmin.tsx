import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  type ConversationItem,
} from '../../features/conversation/api'
import styles from './admin.module.css'

interface MessageDraft {
  speaker: 'A' | 'B'
  text: string
  blank: boolean
}

interface ChoiceDraft {
  label: string
  isEmoji: boolean
}

interface Draft {
  situation: string
  messages: MessageDraft[]
  choices: ChoiceDraft[]
  answerLine: string
}

const emptyDraft: Draft = {
  situation: '',
  messages: [
    { speaker: 'A', text: '', blank: false },
    { speaker: 'B', text: '', blank: true },
  ],
  choices: [
    { label: '', isEmoji: false },
    { label: '', isEmoji: false },
  ],
  answerLine: '1',
}

function draftFromItem(item: ConversationItem): Draft {
  return {
    situation: item.situation,
    messages: item.messages.map((m) => ({ speaker: m.speaker, text: m.text ?? '', blank: !!m.blank })),
    choices: item.choices.map((c) => ({ label: c.label, isEmoji: !!c.isEmoji })),
    answerLine: String(item.answerIndex + 1),
  }
}

function draftToItem(draft: Draft): Omit<ConversationItem, 'id'> {
  const choices = draft.choices
    .filter((c) => c.label.trim())
    .map((c) => (c.isEmoji ? { label: c.label.trim(), isEmoji: true } : { label: c.label.trim() }))
  return {
    situation: draft.situation.trim(),
    messages: draft.messages.map((m) =>
      m.blank ? { speaker: m.speaker, blank: true } : { speaker: m.speaker, text: m.text.trim() },
    ),
    choices,
    answerIndex: Math.min(Math.max(Number(draft.answerLine) - 1, 0), choices.length - 1),
  }
}

export default function ConversationAdmin() {
  const [items, setItems] = useState<ConversationItem[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)

  function reload() {
    listConversations().then(setItems)
  }

  useEffect(() => {
    reload()
  }, [])

  function startNew() {
    setDraft(emptyDraft)
    setEditingId('new')
  }

  function startEdit(item: ConversationItem) {
    setDraft(draftFromItem(item))
    setEditingId(item.id)
  }

  function cancel() {
    setEditingId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const value = draftToItem(draft)
      if (editingId === 'new') {
        await createConversation(value)
      } else if (editingId) {
        await updateConversation(editingId, value)
      }
      setEditingId(null)
      reload()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 대화를 삭제할까요?')) return
    await deleteConversation(id)
    reload()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin" className={styles.backLink} aria-label="관리자 홈으로">
          ⬅
        </Link>
        <h1 className={styles.title}>대화추론 관리</h1>
      </header>

      {editingId ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <label>상황 설명</label>
            <input
              type="text"
              value={draft.situation}
              onChange={(e) => setDraft((d) => ({ ...d, situation: e.target.value }))}
            />
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>대화 (빈칸에 넣을 말 맞히기)</p>
            {draft.messages.map((m, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>화자</label>
                  <select
                    value={m.speaker}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        messages: d.messages.map((row, ri) =>
                          ri === i ? { ...row, speaker: e.target.value as 'A' | 'B' } : row,
                        ),
                      }))
                    }
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                <div className={styles.field} style={{ flex: '2 1 200px' }}>
                  <label>대사</label>
                  <input
                    type="text"
                    disabled={m.blank}
                    value={m.text}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        messages: d.messages.map((row, ri) => (ri === i ? { ...row, text: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={m.blank}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        messages: d.messages.map((row, ri) => (ri === i ? { ...row, blank: e.target.checked } : row)),
                      }))
                    }
                  />
                  빈칸(정답 넣을 자리)
                </label>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, messages: d.messages.filter((_, ri) => ri !== i) }))}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRowButton}
              onClick={() => setDraft((d) => ({ ...d, messages: [...d.messages, { speaker: 'A', text: '', blank: false }] }))}
            >
              + 대사 추가
            </button>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>빈칸에 들어갈 보기</p>
            {draft.choices.map((c, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field} style={{ flex: '2 1 200px' }}>
                  <label>내용 (또는 이모지 하나)</label>
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        choices: d.choices.map((row, ri) => (ri === i ? { ...row, label: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={c.isEmoji}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        choices: d.choices.map((row, ri) => (ri === i ? { ...row, isEmoji: e.target.checked } : row)),
                      }))
                    }
                  />
                  이모지 보기예요
                </label>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, choices: d.choices.filter((_, ri) => ri !== i) }))}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRowButton}
              onClick={() => setDraft((d) => ({ ...d, choices: [...d.choices, { label: '', isEmoji: false }] }))}
            >
              + 보기 추가
            </button>
          </div>

          <div className={styles.field}>
            <label>정답 보기 번호 (1부터 시작)</label>
            <input
              type="number"
              min={1}
              value={draft.answerLine}
              onChange={(e) => setDraft((d) => ({ ...d, answerLine: e.target.value }))}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.saveButton} disabled={saving} onClick={handleSave}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={cancel}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <button type="button" className={styles.addButton} onClick={startNew}>
            + 새 대화 만들기
          </button>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 대화가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
                <div key={item.id} className={styles.row}>
                  <span className={styles.rowTitle}>{item.situation}</span>
                  <div className={styles.rowActions}>
                    <button type="button" className={styles.smallButton} onClick={() => startEdit(item)}>
                      수정
                    </button>
                    <button type="button" className={styles.dangerButton} onClick={() => handleDelete(item.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
