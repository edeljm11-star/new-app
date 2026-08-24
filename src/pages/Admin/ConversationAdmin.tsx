import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  type ConversationItem,
} from '../../features/conversation/api'
import { groupConversations, titleOf, GROUP_DEFS, type ConversationGroupKey } from '../../features/conversation/grouping'
import ApiKeyModal from '../../components/Admin/ApiKeyModal'
import { getGeminiApiKey } from '../../lib/adminSettings'
import { generateGeminiJSON, GeminiError } from '../../lib/gemini'
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
  // Which list group (친구와의 대화/가족과의 대화/...) this item shows under. ''
  // means "let the id-based legacy lookup decide" (only ever true for the
  // original seeded items).
  groupKey: '' | ConversationGroupKey
  // Short list-display title. Empty falls back to the situation sentence.
  title: string
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
  groupKey: '',
  title: '',
}

interface AiMessage {
  speaker: 'A' | 'B'
  text: string
  blank: boolean
}

interface AiResult {
  title: string
  situation: string
  messages: AiMessage[]
  choices: string[]
  answerIndex: number
}

const AI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    situation: { type: 'STRING' },
    messages: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          speaker: { type: 'STRING', enum: ['A', 'B'] },
          text: { type: 'STRING' },
          blank: { type: 'BOOLEAN' },
        },
        required: ['speaker', 'text', 'blank'],
      },
    },
    choices: { type: 'ARRAY', items: { type: 'STRING' } },
    answerIndex: { type: 'INTEGER' },
  },
  required: ['title', 'situation', 'messages', 'choices', 'answerIndex'],
}

function buildPrompt(categoryLabel: string, hint: string): string {
  return `당신은 초등학생을 위한 "대화추론" 학습 콘텐츠를 만드는 도우미입니다.

다음 조건에 맞는 새로운 대화 문제 하나를 만들어주세요:
- 분류: ${categoryLabel}
${hint.trim() ? `- 힌트: ${hint.trim()}` : '- 구체적인 상황은 자유롭게 만들어주세요.'}

이 앱의 대화추론 문제는 A와 B 두 사람의 짧은 대화이며, 그중 한 마디가 빈칸으로 가려져 있고 아이는 보기 중에서 빈칸에 들어갈 가장 알맞은 말을 골라야 합니다.

다음 형식의 JSON으로만 답하세요:
- title: 목록에 표시될 짧은 제목 (예: "약속 시간 조율하기"). 질문 문장이 아니라 "~하기"로 끝나는 8~16자 내외 표현.
- situation: 이 대화가 어떤 상황인지 한 문장으로 설명 (예: "친구와 만날 시간을 정하고 있어요.")
- messages: A와 B가 번갈아 말하는 대사 3~5개. 각 항목은 speaker("A" 또는 "B"), text(대사, 단 blank가 true인 항목은 빈 문자열 ""), blank(이 대사가 빈칸으로 가려질 대사면 true, 아니면 false)로 구성하세요. 빈칸(blank:true)은 정확히 하나만 있어야 하고, 마지막 대사이거나 대화 흐름상 자연스러운 위치에 두세요.
- choices: 빈칸에 들어갈 보기 3~4개. 정답 1개와, 상황에 안 맞거나 무례하거나 어색한 오답들로 구성하세요.
- answerIndex: choices 중 정답의 순번 (0부터 시작)
- 모든 텍스트는 한국어로, 초등학생이 이해하기 쉬운 말투로 작성하세요.`
}

function draftFromItem(item: ConversationItem): Draft {
  return {
    situation: item.situation,
    messages: item.messages.map((m) => ({ speaker: m.speaker, text: m.text ?? '', blank: !!m.blank })),
    choices: item.choices.map((c) => ({ label: c.label, isEmoji: !!c.isEmoji })),
    answerLine: String(item.answerIndex + 1),
    groupKey: (item.groupKey as ConversationGroupKey) ?? '',
    title: item.title ?? '',
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
    groupKey: draft.groupKey || undefined,
    title: draft.title.trim() || undefined,
  }
}

export default function ConversationAdmin() {
  const [items, setItems] = useState<ConversationItem[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<ConversationGroupKey>>(new Set())

  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [aiCategory, setAiCategory] = useState<ConversationGroupKey>(GROUP_DEFS[0].key)
  const [aiHint, setAiHint] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const groups = useMemo(() => (items ? groupConversations(items) : []), [items])

  function toggleGroup(key: ConversationGroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function reload() {
    listConversations().then(setItems)
  }

  useEffect(() => {
    reload()
  }, [])

  function startNew() {
    setDraft(emptyDraft)
    setSaveError(null)
    setEditingId('new')
  }

  async function openAiPanel() {
    const key = await getGeminiApiKey()
    if (!key) {
      setShowApiKeyModal(true)
      return
    }
    setAiError(null)
    setShowAiPanel(true)
  }

  function cancelAiPanel() {
    setShowAiPanel(false)
    setAiError(null)
  }

  async function handleGenerate() {
    setAiLoading(true)
    setAiError(null)
    try {
      const key = await getGeminiApiKey()
      if (!key) {
        setShowApiKeyModal(true)
        return
      }
      const categoryLabel = GROUP_DEFS.find((g) => g.key === aiCategory)?.label ?? aiCategory
      const result = await generateGeminiJSON<AiResult>(key, buildPrompt(categoryLabel, aiHint), AI_RESPONSE_SCHEMA)

      setDraft({
        situation: result.situation,
        messages: result.messages.map((m) => ({ speaker: m.speaker, text: m.text, blank: m.blank })),
        choices: result.choices.map((c) => ({ label: c, isEmoji: false })),
        answerLine: String(result.answerIndex + 1),
        groupKey: aiCategory,
        title: result.title,
      })
      setShowAiPanel(false)
      setAiHint('')
      setSaveError(null)
      setEditingId('new')
    } catch (err) {
      setAiError(err instanceof GeminiError ? err.message : 'AI 생성 중 문제가 생겼어요. 다시 시도해주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  function startEdit(item: ConversationItem) {
    setDraft(draftFromItem(item))
    setSaveError(null)
    setEditingId(item.id)
  }

  function cancel() {
    setEditingId(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const value = draftToItem(draft)
      if (editingId === 'new') {
        await createConversation(value)
      } else if (editingId) {
        await updateConversation(editingId, value)
      }
      setEditingId(null)
      reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했어요. 다시 시도해주세요.')
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
        <Link to="/" className={styles.homeLink} aria-label="홈으로 가기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>
      </header>

      {editingId ? (
        <div className={styles.form}>
          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>목록 분류</p>
            <div className={styles.field}>
              <label>제목 (관리자 목록에 표시돼요. 예: 약속 시간 조율하기)</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="비워두면 상황 설명이 그대로 표시돼요"
              />
            </div>
            <div className={styles.field}>
              <label>이 대화가 대화추론 목록에서 보일 카테고리</label>
              <select
                value={draft.groupKey}
                onChange={(e) => setDraft((d) => ({ ...d, groupKey: e.target.value as Draft['groupKey'] }))}
              >
                <option value="">(자동 — 알 수 없으면 '친구와의 대화'에 들어가요)</option>
                {GROUP_DEFS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.emoji} {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          {saveError && <p className={styles.errorText}>{saveError}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.saveButton} disabled={saving} onClick={handleSave}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={cancel}>
              취소
            </button>
          </div>
        </div>
      ) : showAiPanel ? (
        <div className={styles.aiPanel}>
          <p className={styles.aiPanelTitle}>✨ AI로 대화 만들기</p>
          <div className={styles.field}>
            <label>카테고리</label>
            <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value as ConversationGroupKey)}>
              {GROUP_DEFS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.emoji} {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>상황 힌트 (선택 — 비워두면 AI가 알아서 만들어요)</label>
            <textarea
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder="예: 병원에서 배가 아파서 진료받는 상황"
            />
          </div>
          {aiError && <p className={styles.errorText}>{aiError}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.aiButton} disabled={aiLoading} onClick={handleGenerate}>
              {aiLoading ? '생성 중...' : '✨ 생성하기'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={cancelAiPanel} disabled={aiLoading}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.actionRow}>
            <button type="button" className={styles.addButton} onClick={startNew}>
              + 새 대화 만들기
            </button>
            <button type="button" className={styles.aiButton} onClick={openAiPanel}>
              ✨ AI로 만들기
            </button>
          </div>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 대화가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {groups.map(({ def, items: groupItems }) => {
                const isOpen = openGroups.has(def.key)
                return (
                  <div key={def.key}>
                    <button
                      type="button"
                      className={styles.groupHeader}
                      aria-expanded={isOpen}
                      onClick={() => toggleGroup(def.key)}
                    >
                      <span className={styles.groupEmoji}>{def.emoji}</span>
                      <span className={styles.groupLabel}>{def.label}</span>
                      <span className={styles.groupCount}>{groupItems.length}개</span>
                      <span className={[styles.groupChevron, isOpen ? styles.groupChevronOpen : ''].join(' ')}>▾</span>
                    </button>
                    {isOpen && (
                      <div className={styles.groupBody}>
                        {groupItems.map((item) => (
                          <div key={item.id} className={styles.row}>
                            <span className={styles.rowTitle}>{titleOf(item)}</span>
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
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSaved={() => {
            setShowApiKeyModal(false)
            setAiError(null)
            setShowAiPanel(true)
          }}
        />
      )}
    </div>
  )
}
