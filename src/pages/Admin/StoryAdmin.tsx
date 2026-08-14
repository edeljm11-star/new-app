import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStories, createStory, updateStory, deleteStory, type Story, type VocabQuizItem } from '../../features/story/api'
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
  }
}

export default function StoryAdmin() {
  const [items, setItems] = useState<Story[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)

  function reload() {
    listStories().then(setItems)
  }

  useEffect(() => {
    reload()
  }, [])

  function startNew() {
    setDraft(emptyDraft)
    setEditingId('new')
  }

  function startEdit(item: Story) {
    setDraft(draftFromStory(item))
    setEditingId(item.id)
  }

  function cancel() {
    setEditingId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const value = draftToStory(draft)
      if (editingId === 'new') {
        await createStory(value)
      } else if (editingId) {
        await updateStory(editingId, value)
      }
      setEditingId(null)
      reload()
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
      </header>

      {editingId ? (
        <div className={styles.form}>
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
            + 새 이야기 만들기
          </button>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 이야기가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {items.map((item) => (
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
        </>
      )}
    </div>
  )
}
