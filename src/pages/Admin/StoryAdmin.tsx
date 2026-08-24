import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStories, createStory, updateStory, deleteStory, type Story, type VocabQuizItem } from '../../features/story/api'
import { groupStories, GROUP_DEFS, type StoryGroupKey } from '../../features/story/grouping'
import ApiKeyModal from '../../components/Admin/ApiKeyModal'
import ScrollToTopButton from '../../components/Admin/ScrollToTopButton'
import { getGeminiApiKey } from '../../lib/adminSettings'
import { generateGeminiJSON, GeminiError } from '../../lib/gemini'
import styles from './admin.module.css'

interface VocabDraft {
  word: string
  meaning: string
}

interface TrueFalseDraft {
  statement: string
  answer: boolean
}

type VocabQuizType = NonNullable<VocabQuizItem['type']>

interface VocabQuizDraft {
  type: VocabQuizType
  word: string
  choicesText: string
  answerLine: string
}

const VOCAB_QUIZ_TYPE_OPTIONS: { value: VocabQuizType; label: string }[] = [
  { value: 'vocab', label: '단어 뜻' },
  { value: 'proverb', label: '속담·사자성어' },
  { value: 'synonym', label: '비슷한말' },
  { value: 'antonym', label: '반대말' },
  { value: 'spelling', label: '맞춤법' },
]

interface Draft {
  emoji: string
  title: string
  paragraphsText: string
  vocabulary: VocabDraft[]
  trueFalse: TrueFalseDraft[]
  themeQuestion: string
  themeChoicesText: string
  themeAnswerLine: string
  vocabQuiz: VocabQuizDraft[]
  // Which list group (생활 이야기/속담 이야기/동화 이야기) this item shows under.
  // '' means "let the id-based legacy lookup decide" (only ever true for
  // the original seeded stories).
  groupKey: '' | StoryGroupKey
}

const emptyDraft: Draft = {
  emoji: '📖',
  title: '',
  paragraphsText: '',
  vocabulary: [{ word: '', meaning: '' }],
  trueFalse: [{ statement: '', answer: true }],
  themeQuestion: '',
  themeChoicesText: '',
  themeAnswerLine: '1',
  vocabQuiz: [{ type: 'vocab', word: '', choicesText: '', answerLine: '1' }],
  groupKey: '',
}

interface AiVocab {
  word: string
  meaning: string
}

interface AiTrueFalse {
  statement: string
  answer: boolean
}

interface AiVocabQuiz {
  type: VocabQuizType
  word: string
  choices: string[]
  answerIndex: number
}

interface AiResult {
  emoji: string
  title: string
  paragraphs: string[]
  vocabulary: AiVocab[]
  trueFalse: AiTrueFalse[]
  mainTheme: { question: string; choices: string[]; answerIndex: number }
  vocabQuiz: AiVocabQuiz[]
}

const AI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    emoji: { type: 'STRING' },
    title: { type: 'STRING' },
    paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
    vocabulary: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { word: { type: 'STRING' }, meaning: { type: 'STRING' } },
        required: ['word', 'meaning'],
      },
    },
    trueFalse: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { statement: { type: 'STRING' }, answer: { type: 'BOOLEAN' } },
        required: ['statement', 'answer'],
      },
    },
    mainTheme: {
      type: 'OBJECT',
      properties: {
        question: { type: 'STRING' },
        choices: { type: 'ARRAY', items: { type: 'STRING' } },
        answerIndex: { type: 'INTEGER' },
      },
      required: ['question', 'choices', 'answerIndex'],
    },
    vocabQuiz: {
      type: 'ARRAY',
      minItems: 4,
      maxItems: 5,
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['vocab', 'proverb', 'synonym', 'antonym', 'spelling'] },
          word: { type: 'STRING' },
          choices: { type: 'ARRAY', items: { type: 'STRING' } },
          answerIndex: { type: 'INTEGER' },
        },
        required: ['type', 'word', 'choices', 'answerIndex'],
      },
    },
  },
  required: ['emoji', 'title', 'paragraphs', 'vocabulary', 'trueFalse', 'mainTheme', 'vocabQuiz'],
}

function buildPrompt(categoryLabel: string, hint: string): string {
  return `당신은 초등학생을 위한 "내용이해" 독해 학습 콘텐츠를 만드는 도우미입니다.

다음 조건에 맞는 새로운 이야기 한 편을 만들어주세요:
- 분류: ${categoryLabel}
${hint.trim() ? `- 힌트: ${hint.trim()}` : '- 구체적인 내용은 자유롭게 만들어주세요.'}

분류별 안내:
- "생활 이야기"는 학교나 가정에서 벌어지는 평범한 일상 속에서 배울 점이 있는 이야기예요.
- "속담 이야기"는 힌트로 속담이 주어지면 그 속담을, 없다면 널리 알려진 한국 속담을 하나 골라 이야기 속 상황으로 자연스럽게 풀어내야 해요. 이야기 끝에서 그 속담의 의미가 드러나야 합니다.
- "동화 이야기"는 잘 알려진 전래동화나 세계 명작 동화를 초등학생 눈높이로 짧게 다시 들려주는 이야기예요.

다음 형식의 JSON으로만 답하세요:
- emoji: 이야기를 대표하는 이모지 하나
- title: 이야기 제목 (8~16자 내외)
- paragraphs: 3~5개의 문단. 각 문단은 2~4문장, 초등학생이 읽기 쉬운 문장으로 작성하세요.
- vocabulary: 이야기에 나온 낱말 중 3~4개를 골라 word(낱말)와 meaning(쉬운 뜻풀이)로 제공하세요.
- trueFalse: 이야기 내용과 일치하는지 판단하는 문장 3~4개. statement(문장)와 answer(내용과 일치하면 true, 아니면 false)로 구성하고, true와 false를 골고루 섞어주세요.
- mainTheme: 이야기의 중심 생각이나 교훈을 묻는 질문 하나. question, choices(4개, 정답 1개+그럴듯한 오답 3개), answerIndex(0부터 시작하는 정답 순번)로 구성하세요.
- vocabQuiz: 이야기 속 낱말을 활용한 어휘 문제. type이 서로 다른 문제를 아래처럼 반드시 모두 포함해서 만들어주세요 (분류가 "속담 이야기"가 아니면 4개, "속담 이야기"면 5개):
  - type "vocab" 1개: 이야기 속 낱말의 뜻을 묻는 문제
  - type "synonym" 1개: 이야기 속 낱말의 비슷한말을 묻는 문제
  - type "antonym" 1개: 이야기 속 낱말의 반대말을 묻는 문제
  - type "spelling" 1개: 이야기 속 낱말과 발음은 비슷하지만 맞춤법이 틀린 표기를 보기에 섞어, 올바른 맞춤법을 고르는 문제
  - (분류가 "속담 이야기"일 때만) type "proverb" 1개: 이 이야기에 쓰인 속담의 뜻이나 형태를 묻는 문제
  각 항목은 type, word(문제에서 다룰 낱말이나 짧은 구), choices(4개, 정답 1개+그럴듯한 오답 3개), answerIndex(0부터 시작하는 정답 순번)로 구성하세요.
- 모든 텍스트는 한국어로, 초등학생이 이해하기 쉬운 말투로 작성하세요.`
}

function draftFromStory(s: Story): Draft {
  return {
    emoji: s.emoji,
    title: s.title,
    paragraphsText: s.paragraphs.join('\n'),
    vocabulary: s.vocabulary.map((v) => ({ word: v.word, meaning: v.meaning })),
    trueFalse: s.trueFalse.map((t) => ({ statement: t.statement, answer: t.answer })),
    themeQuestion: s.mainTheme.question,
    themeChoicesText: s.mainTheme.choices.join('\n'),
    themeAnswerLine: String(s.mainTheme.answerIndex + 1),
    vocabQuiz: s.vocabQuiz.map((v) => ({
      type: v.type ?? 'vocab',
      word: v.word,
      choicesText: v.choices.join('\n'),
      answerLine: String(v.answerIndex + 1),
    })),
    groupKey: (s.groupKey as StoryGroupKey) ?? '',
  }
}

function linesOf(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function draftToStory(draft: Draft): Omit<Story, 'id'> {
  const themeChoices = linesOf(draft.themeChoicesText)
  return {
    emoji: draft.emoji.trim(),
    title: draft.title.trim(),
    paragraphs: linesOf(draft.paragraphsText),
    vocabulary: draft.vocabulary
      .filter((v) => v.word.trim())
      .map((v) => ({ word: v.word.trim(), meaning: v.meaning.trim() })),
    trueFalse: draft.trueFalse
      .filter((t) => t.statement.trim())
      .map((t) => ({ statement: t.statement.trim(), answer: t.answer })),
    mainTheme: {
      question: draft.themeQuestion.trim(),
      choices: themeChoices,
      answerIndex: Math.min(Math.max(Number(draft.themeAnswerLine) - 1, 0), themeChoices.length - 1),
    },
    vocabQuiz: draft.vocabQuiz
      .filter((v) => v.word.trim())
      .map((v) => {
        const choices = linesOf(v.choicesText)
        return {
          type: v.type,
          word: v.word.trim(),
          choices,
          answerIndex: Math.min(Math.max(Number(v.answerLine) - 1, 0), choices.length - 1),
        }
      }),
    groupKey: draft.groupKey || undefined,
  }
}

export default function StoryAdmin() {
  const [items, setItems] = useState<Story[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<StoryGroupKey>>(new Set())

  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [aiCategory, setAiCategory] = useState<StoryGroupKey>(GROUP_DEFS[0].key)
  const [aiHint, setAiHint] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const groups = useMemo(() => (items ? groupStories(items) : []), [items])

  function toggleGroup(key: StoryGroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function reload() {
    listStories().then(setItems)
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
        emoji: result.emoji,
        title: result.title,
        paragraphsText: result.paragraphs.join('\n'),
        vocabulary: result.vocabulary.map((v) => ({ word: v.word, meaning: v.meaning })),
        trueFalse: result.trueFalse.map((t) => ({ statement: t.statement, answer: t.answer })),
        themeQuestion: result.mainTheme.question,
        themeChoicesText: result.mainTheme.choices.join('\n'),
        themeAnswerLine: String(result.mainTheme.answerIndex + 1),
        vocabQuiz: result.vocabQuiz.map((v) => ({
          type: v.type,
          word: v.word,
          choicesText: v.choices.join('\n'),
          answerLine: String(v.answerIndex + 1),
        })),
        groupKey: aiCategory,
      })
      setShowAiPanel(false)
      setAiHint('')
      setEditingId('new')
    } catch (err) {
      setAiError(err instanceof GeminiError ? err.message : 'AI 생성 중 문제가 생겼어요. 다시 시도해주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  function startEdit(item: Story) {
    setDraft(draftFromStory(item))
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
      const value = draftToStory(draft)
      if (editingId === 'new') {
        await createStory(value)
      } else if (editingId) {
        await updateStory(editingId, value)
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
    if (!confirm('이 이야기를 삭제할까요?')) return
    await deleteStory(id)
    reload()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin" className={styles.backLink} aria-label="관리자 홈으로">
          ⬅
        </Link>
        <h1 className={styles.title}>내용이해 관리</h1>
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
              <label>이 이야기가 내용이해 목록에서 보일 카테고리</label>
              <select
                value={draft.groupKey}
                onChange={(e) => setDraft((d) => ({ ...d, groupKey: e.target.value as Draft['groupKey'] }))}
              >
                <option value="">(자동 — 알 수 없으면 '생활 이야기'에 들어가요)</option>
                {GROUP_DEFS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.emoji} {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>이모지</label>
            <input type="text" value={draft.emoji} onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))} />
          </div>

          <div className={styles.field}>
            <label>제목</label>
            <input type="text" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>

          <div className={styles.field}>
            <label>이야기 본문 (한 줄에 한 문단)</label>
            <textarea
              value={draft.paragraphsText}
              onChange={(e) => setDraft((d) => ({ ...d, paragraphsText: e.target.value }))}
              style={{ minHeight: 140 }}
            />
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>낱말 뜻풀이</p>
            {draft.vocabulary.map((v, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>낱말</label>
                  <input
                    type="text"
                    value={v.word}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabulary: d.vocabulary.map((row, ri) => (ri === i ? { ...row, word: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>뜻</label>
                  <input
                    type="text"
                    value={v.meaning}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabulary: d.vocabulary.map((row, ri) => (ri === i ? { ...row, meaning: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, vocabulary: d.vocabulary.filter((_, ri) => ri !== i) }))}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRowButton}
              onClick={() => setDraft((d) => ({ ...d, vocabulary: [...d.vocabulary, { word: '', meaning: '' }] }))}
            >
              + 낱말 추가
            </button>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>내용 일치 (O/X)</p>
            {draft.trueFalse.map((t, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field} style={{ flex: '2 1 200px' }}>
                  <label>문장</label>
                  <input
                    type="text"
                    value={t.statement}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        trueFalse: d.trueFalse.map((row, ri) => (ri === i ? { ...row, statement: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    checked={t.answer}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        trueFalse: d.trueFalse.map((row, ri) => (ri === i ? { ...row, answer: e.target.checked } : row)),
                      }))
                    }
                  />
                  맞는 문장이에요 (O)
                </label>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, trueFalse: d.trueFalse.filter((_, ri) => ri !== i) }))}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRowButton}
              onClick={() => setDraft((d) => ({ ...d, trueFalse: [...d.trueFalse, { statement: '', answer: true }] }))}
            >
              + 문장 추가
            </button>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>핵심 주제 퀴즈</p>
            <div className={styles.field}>
              <label>질문</label>
              <input
                type="text"
                value={draft.themeQuestion}
                onChange={(e) => setDraft((d) => ({ ...d, themeQuestion: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>보기 (한 줄에 하나씩)</label>
              <textarea
                value={draft.themeChoicesText}
                onChange={(e) => setDraft((d) => ({ ...d, themeChoicesText: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>정답 줄 번호 (1부터 시작)</label>
              <input
                type="number"
                min={1}
                value={draft.themeAnswerLine}
                onChange={(e) => setDraft((d) => ({ ...d, themeAnswerLine: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>어휘 퀴즈</p>
            {draft.vocabQuiz.map((v, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>문제 유형</label>
                  <select
                    value={v.type}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabQuiz: d.vocabQuiz.map((row, ri) =>
                          ri === i ? { ...row, type: e.target.value as VocabQuizType } : row,
                        ),
                      }))
                    }
                  >
                    {VOCAB_QUIZ_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>낱말</label>
                  <input
                    type="text"
                    value={v.word}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabQuiz: d.vocabQuiz.map((row, ri) => (ri === i ? { ...row, word: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <div className={styles.field} style={{ flex: '2 1 200px' }}>
                  <label>보기 (한 줄에 하나씩)</label>
                  <textarea
                    value={v.choicesText}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabQuiz: d.vocabQuiz.map((row, ri) => (ri === i ? { ...row, choicesText: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>정답 줄 번호</label>
                  <input
                    type="number"
                    min={1}
                    value={v.answerLine}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        vocabQuiz: d.vocabQuiz.map((row, ri) => (ri === i ? { ...row, answerLine: e.target.value } : row)),
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, vocabQuiz: d.vocabQuiz.filter((_, ri) => ri !== i) }))}
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addRowButton}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  vocabQuiz: [...d.vocabQuiz, { type: 'vocab', word: '', choicesText: '', answerLine: '1' }],
                }))
              }
            >
              + 어휘 문제 추가
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
          <p className={styles.aiPanelTitle}>✨ AI로 이야기 만들기</p>
          <div className={styles.field}>
            <label>분류</label>
            <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value as StoryGroupKey)}>
              {GROUP_DEFS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.emoji} {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>힌트 (선택 — 비워두면 AI가 알아서 만들어요)</label>
            <textarea
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder="예: 원숭이도 나무에서 떨어진다"
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
              + 새 이야기 만들기
            </button>
            <button type="button" className={styles.aiButton} onClick={openAiPanel}>
              ✨ AI로 만들기
            </button>
          </div>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 이야기가 없어요.</p>
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
                              {item.emoji} {item.title}
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
