import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listSituations,
  createSituation,
  updateSituation,
  deleteSituation,
  type SituationItem,
} from '../../features/situation/api'
import styles from './admin.module.css'

interface SceneItemDraft {
  emoji: string
  top: string
  left: string
  size: string
}

interface Draft {
  question: string
  choicesText: string
  answerLine: string
  explanation: string
  sceneBg: string
  items: SceneItemDraft[]
}

const emptyDraft: Draft = {
  question: '',
  choicesText: '',
  answerLine: '1',
  explanation: '',
  sceneBg: 'var(--color-pink-soft)',
  items: [{ emoji: '', top: '50%', left: '50%', size: '60' }],
}

function draftFromItem(item: SituationItem): Draft {
  return {
    question: item.question,
    choicesText: item.choices.join('\n'),
    answerLine: String(item.answerIndex + 1),
    explanation: item.explanation,
    sceneBg: item.scene.bg,
    items: item.scene.items.map((i) => ({
      emoji: i.emoji,
      top: i.top,
      left: i.left,
      size: String(i.size ?? 48),
    })),
  }
}

function draftToItem(draft: Draft): Omit<SituationItem, 'id'> {
  const choices = draft.choicesText.split('\n').map((s) => s.trim()).filter(Boolean)
  const answerIndex = Math.min(Math.max(Number(draft.answerLine) - 1, 0), choices.length - 1)
  return {
    question: draft.question.trim(),
    choices,
    answerIndex,
    explanation: draft.explanation.trim(),
    scene: {
      bg: draft.sceneBg.trim(),
      items: draft.items
        .filter((i) => i.emoji.trim())
        .map((i) => ({ emoji: i.emoji.trim(), top: i.top.trim(), left: i.left.trim(), size: Number(i.size) || 48 })),
    },
  }
}

export default function SituationAdmin() {
  const [items, setItems] = useState<SituationItem[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)

  function reload() {
    listSituations().then(setItems)
  }

  useEffect(() => {
    reload()
  }, [])

  function startNew() {
    setDraft(emptyDraft)
    setEditingId('new')
  }

  function startEdit(item: SituationItem) {
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
        await createSituation(value)
      } else if (editingId) {
        await updateSituation(editingId, value)
      }
      setEditingId(null)
      reload()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 문제를 삭제할까요?')) return
    await deleteSituation(id)
    reload()
  }

  function updateItemRow(index: number, patch: Partial<SceneItemDraft>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }))
  }

  function addItemRow() {
    setDraft((d) => ({ ...d, items: [...d.items, { emoji: '', top: '50%', left: '50%', size: '60' }] }))
  }

  function removeItemRow(index: number) {
    setDraft((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin" className={styles.backLink} aria-label="관리자 홈으로">
          ⬅
        </Link>
        <h1 className={styles.title}>상황추론 관리</h1>
      </header>

      {editingId ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <label>질문</label>
            <input
              type="text"
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label>보기 (한 줄에 하나씩)</label>
            <textarea
              value={draft.choicesText}
              onChange={(e) => setDraft((d) => ({ ...d, choicesText: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label>정답 줄 번호 (1부터 시작)</label>
            <input
              type="number"
              min={1}
              value={draft.answerLine}
              onChange={(e) => setDraft((d) => ({ ...d, answerLine: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label>설명 (정답을 고른 뒤 보여줄 문구)</label>
            <textarea
              value={draft.explanation}
              onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
            />
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>그림 배경</p>
            <div className={styles.field}>
              <label>배경색 (예: var(--color-pink-soft))</label>
              <input
                type="text"
                value={draft.sceneBg}
                onChange={(e) => setDraft((d) => ({ ...d, sceneBg: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>그림 속 이모지</p>
            {draft.items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>이모지</label>
                  <input type="text" value={item.emoji} onChange={(e) => updateItemRow(i, { emoji: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>위 (top, 예: 45%)</label>
                  <input type="text" value={item.top} onChange={(e) => updateItemRow(i, { top: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>왼쪽 (left, 예: 35%)</label>
                  <input type="text" value={item.left} onChange={(e) => updateItemRow(i, { left: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>크기</label>
                  <input type="number" value={item.size} onChange={(e) => updateItemRow(i, { size: e.target.value })} />
                </div>
                <button type="button" className={styles.removeRowButton} onClick={() => removeItemRow(i)}>
                  삭제
                </button>
              </div>
            ))}
            <button type="button" className={styles.addRowButton} onClick={addItemRow}>
              + 이모지 추가
            </button>
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
            + 새 문제 만들기
          </button>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 문제가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
                <div key={item.id} className={styles.row}>
                  <span className={styles.rowTitle}>{item.question}</span>
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
