import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listSituations,
  createSituation,
  updateSituation,
  deleteSituation,
  type SituationCategory,
  type SituationItem,
} from '../../features/situation/api'
import { groupSituations, titleOf, GROUP_DEFS, type SituationGroupKey } from '../../features/situation/grouping'
import ApiKeyModal from '../../components/Admin/ApiKeyModal'
import ScrollToTopButton from '../../components/Admin/ScrollToTopButton'
import { getGeminiApiKey } from '../../lib/adminSettings'
import { generateGeminiJSON, GeminiError } from '../../lib/gemini'
import styles from './admin.module.css'

interface SceneItemDraft {
  emoji: string
  top: string
  left: string
  size: string
}

interface QuestionDraft {
  category: '' | SituationCategory
  question: string
  choicesText: string
  answerLine: string
  explanation: string
}

interface Draft {
  questions: QuestionDraft[]
  sceneBg: string
  items: SceneItemDraft[]
  // Which list group (친구 돕기/감정 이해·위로/...) this item shows under.
  // '' means "let the id-based legacy lookup decide" (only ever true for
  // the original 450 seeded items).
  groupKey: '' | SituationGroupKey
  // Short list-display title, e.g. "체육시간 다친 발목에 얼음찜질 도와주기". Empty
  // falls back to the full question sentence.
  title: string
}

const CATEGORY_OPTIONS: { value: '' | SituationCategory; label: string }[] = [
  { value: '', label: '(없음)' },
  { value: 'observe', label: '관찰' },
  { value: 'emotion', label: '감정' },
  { value: 'thought', label: '사고' },
  { value: 'apply', label: '적용' },
]

const emptyQuestion: QuestionDraft = { category: '', question: '', choicesText: '', answerLine: '1', explanation: '' }

const emptyDraft: Draft = {
  questions: [emptyQuestion],
  sceneBg: 'var(--color-pink-soft)',
  items: [{ emoji: '', top: '50%', left: '50%', size: '60' }],
  groupKey: '',
  title: '',
}

interface AiSceneItem {
  emoji: string
  top: string
  left: string
  size: number
}

interface AiQuestion {
  category: SituationCategory
  question: string
  choices: string[]
  answerIndex: number
  explanation: string
}

interface AiResult {
  title: string
  sceneItems: AiSceneItem[]
  questions: AiQuestion[]
}

const AI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    sceneItems: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          emoji: { type: 'STRING' },
          top: { type: 'STRING' },
          left: { type: 'STRING' },
          size: { type: 'NUMBER' },
        },
        required: ['emoji', 'top', 'left', 'size'],
      },
    },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING', enum: ['observe', 'emotion', 'thought', 'apply'] },
          question: { type: 'STRING' },
          choices: { type: 'ARRAY', items: { type: 'STRING' } },
          answerIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['category', 'question', 'choices', 'answerIndex', 'explanation'],
      },
    },
  },
  required: ['title', 'sceneItems', 'questions'],
}

function buildPrompt(categoryLabel: string, hint: string): string {
  return `당신은 초등학생을 위한 "상황추론" 학습 콘텐츠를 만드는 도우미입니다.

다음 조건에 맞는 새로운 문제 세트를 하나 만들어주세요:
- 카테고리: ${categoryLabel}
${hint.trim() ? `- 상황 힌트: ${hint.trim()}` : '- 구체적인 상황은 자유롭게 만들어주세요.'}

이 앱의 상황추론 문제는 이모지 몇 개로 이루어진 "장면"과, 그 장면에 대한 4개의 질문(관찰→감정→사고→적용 순서)으로 구성됩니다. 아이는 그림(이모지)만 보고 첫 번째(관찰) 질문에 답해야 하므로, 관찰 질문의 정답은 반드시 장면의 이모지만으로 명확히 알 수 있어야 하고, 정답과 모순되거나 헷갈리는 이모지가 섞이면 안 됩니다.

좋은 예시 (스타일만 참고하고 그대로 베끼지 마세요):
장면 이모지: 📚(책) ❓(물음표) 😕(당황한 얼굴)
관찰 질문: "그림 속 친구의 모습에서 알 수 있는 것은 무엇인가요?"
정답: "책장 앞에서 찾는 책이 안 보여 두리번거리고 있어요"
(😕 표정과 ❓가 함께 있어서 "당황해서 무언가를 찾고 있다"는 것이 그림만으로 명확히 보입니다.)

다음 형식의 JSON으로만 답하세요:
- title: 이 문제가 관리자 목록에서 보일 짧은 제목. 질문 문장이 아니라 상황을 요약하는 명사형 제목이어야 합니다. "~하기", "~할 때", "~때 돕기"처럼 끝나는 10~20자 내외 표현을 쓰세요. (예: "체육시간 다친 발목에 얼음찜질 도와주기", "발표 중 머릿속이 하얘질 때", "친구 과제 베끼고 싶은 유혹")
- sceneItems: 이모지 2~4개. 각 항목은 emoji(이모지 하나), top("20%"~"70%" 사이 문자열), left("20%"~"80%" 사이 문자열), size(24~70 사이 숫자)를 가집니다. 서로 겹치지 않도록 위치를 다양하게 배치하세요. 등장인물의 표정을 나타내는 이모지를 반드시 포함해서, 관찰 질문의 정답이 그림만으로 드러나게 하세요.
- questions: 정확히 4개, 순서대로 category가 "observe","emotion","thought","apply" 여야 합니다.
  - observe(관찰): 그림 속 상황을 보면 무엇을 알 수 있는지 묻는 질문. 정답은 장면의 이모지만으로 명확히 판단 가능해야 합니다.
  - emotion(감정): 등장인물의 마음이나 감정을 묻는 질문.
  - thought(사고): 이 상황을 그냥 지나치면 어떻게 될지, 왜 문제가 되는지를 묻는 질문.
  - apply(적용): 이런 상황에서 할 수 있는 가장 좋은 행동을 묻는 질문.
  - 각 질문은 choices 4개(정답 1개 + 그럴듯하지만 명백히 틀린 오답 3개), answerIndex(0부터 시작하는 정답 순번), explanation(정답을 고른 뒤 보여줄 한 문장 설명)을 가집니다.
  - 모든 텍스트는 한국어로, 초등학생이 이해하기 쉬운 말투("~해요", "~인가요?")로 작성하세요.`
}

function draftFromItem(item: SituationItem): Draft {
  return {
    questions: item.questions.map((q) => ({
      category: q.category ?? '',
      question: q.question,
      choicesText: q.choices.join('\n'),
      answerLine: String(q.answerIndex + 1),
      explanation: q.explanation,
    })),
    sceneBg: item.scene.bg,
    items: item.scene.items.map((i) => ({
      emoji: i.emoji,
      top: i.top,
      left: i.left,
      size: String(i.size ?? 48),
    })),
    groupKey: (item.groupKey as SituationGroupKey) ?? '',
    title: item.title ?? '',
  }
}

function draftToItem(draft: Draft): Omit<SituationItem, 'id'> {
  const questions = draft.questions
    .filter((q) => q.question.trim())
    .map((q) => {
      const choices = q.choicesText.split('\n').map((s) => s.trim()).filter(Boolean)
      const answerIndex = Math.min(Math.max(Number(q.answerLine) - 1, 0), choices.length - 1)
      return {
        category: q.category || undefined,
        question: q.question.trim(),
        choices,
        answerIndex,
        explanation: q.explanation.trim(),
      }
    })
  return {
    questions,
    scene: {
      bg: draft.sceneBg.trim(),
      items: draft.items
        .filter((i) => i.emoji.trim())
        .map((i) => ({ emoji: i.emoji.trim(), top: i.top.trim(), left: i.left.trim(), size: Number(i.size) || 48 })),
    },
    groupKey: draft.groupKey || undefined,
    title: draft.title.trim() || undefined,
  }
}

export default function SituationAdmin() {
  const [items, setItems] = useState<SituationItem[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<SituationGroupKey>>(new Set())

  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [aiCategory, setAiCategory] = useState<SituationGroupKey>(GROUP_DEFS[0].key)
  const [aiHint, setAiHint] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const groups = useMemo(() => (items ? groupSituations(items) : []), [items])

  function toggleGroup(key: SituationGroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function reload() {
    listSituations().then(setItems)
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
        sceneBg: emptyDraft.sceneBg,
        groupKey: aiCategory,
        title: result.title,
        items: result.sceneItems.map((it) => ({
          emoji: it.emoji,
          top: it.top,
          left: it.left,
          size: String(it.size),
        })),
        questions: result.questions.map((q) => ({
          category: q.category,
          question: q.question,
          choicesText: q.choices.join('\n'),
          answerLine: String(q.answerIndex + 1),
          explanation: q.explanation,
        })),
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

  function startEdit(item: SituationItem) {
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
        await createSituation(value)
      } else if (editingId) {
        await updateSituation(editingId, value)
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
    if (!confirm('이 문제를 삭제할까요?')) return
    await deleteSituation(id)
    reload()
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }))
  }

  function addQuestion() {
    setDraft((d) => ({ ...d, questions: [...d.questions, emptyQuestion] }))
  }

  function removeQuestion(index: number) {
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== index) }))
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
              <label>제목 (관리자 목록에 표시돼요. 예: 체육시간 다친 발목에 얼음찜질 도와주기)</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="비워두면 질문 문장이 그대로 표시돼요"
              />
            </div>
            <div className={styles.field}>
              <label>이 문제가 상황추론 목록에서 보일 카테고리</label>
              <select
                value={draft.groupKey}
                onChange={(e) => setDraft((d) => ({ ...d, groupKey: e.target.value as Draft['groupKey'] }))}
              >
                <option value="">(자동 — 알 수 없으면 '기타'에 들어가요)</option>
                {GROUP_DEFS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.emoji} {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>문제 목록 (같은 그림으로 여러 문제를 풀어요)</p>
            {draft.questions.map((q, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>카테고리</label>
                  <select value={q.category} onChange={(e) => updateQuestion(i, { category: e.target.value as QuestionDraft['category'] })}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>질문</label>
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>보기 (한 줄에 하나씩)</label>
                  <textarea value={q.choicesText} onChange={(e) => updateQuestion(i, { choicesText: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>정답 줄 번호 (1부터 시작)</label>
                  <input
                    type="number"
                    min={1}
                    value={q.answerLine}
                    onChange={(e) => updateQuestion(i, { answerLine: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>설명 (정답을 고른 뒤 보여줄 문구)</label>
                  <textarea value={q.explanation} onChange={(e) => updateQuestion(i, { explanation: e.target.value })} />
                </div>
                <button type="button" className={styles.removeRowButton} onClick={() => removeQuestion(i)}>
                  문제 삭제
                </button>
              </div>
            ))}
            <button type="button" className={styles.addRowButton} onClick={addQuestion}>
              + 문제 추가
            </button>
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
          <p className={styles.aiPanelTitle}>✨ AI로 문제 만들기</p>
          <div className={styles.field}>
            <label>카테고리</label>
            <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value as SituationGroupKey)}>
              {GROUP_DEFS.filter((g) => g.key !== 'etc').map((g) => (
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
              placeholder="예: 도서관에서 친구가 큰 소리로 떠드는 상황"
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
              + 새 문제 만들기
            </button>
            <button type="button" className={styles.aiButton} onClick={openAiPanel}>
              ✨ AI로 만들기
            </button>
          </div>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 문제가 없어요.</p>
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
                            <span className={styles.rowTitle}>
                              {titleOf(item)}
                              {item.questions.length > 1 ? ` (문제 ${item.questions.length}개)` : ''}
                            </span>
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
      <ScrollToTopButton />
    </div>
  )
}
