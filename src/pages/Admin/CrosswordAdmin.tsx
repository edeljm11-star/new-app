import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listPuzzles,
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
  type CrosswordPuzzle,
} from '../../features/crossword/api'
import { groupByCategory, categoryOf } from '../../features/crossword/grouping'
import { generateCrosswordLayout, type WordInput } from '../../features/crossword/generateLayout'
import ApiKeyModal from '../../components/Admin/ApiKeyModal'
import { getGeminiApiKey } from '../../lib/adminSettings'
import { generateGeminiJSON, GeminiError } from '../../lib/gemini'
import styles from './admin.module.css'

interface WordDraft {
  number: string
  direction: 'across' | 'down'
  row: string
  col: string
  length: string
  answer: string
  hintText: string
  hintEmoji: string
}

interface Draft {
  title: string
  rows: string
  cols: string
  grid: string[][]
  words: WordDraft[]
}

function makeGrid(rows: number, cols: number, from?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => from?.[r]?.[c] ?? ''))
}

const emptyDraft: Draft = {
  title: '',
  rows: '5',
  cols: '5',
  grid: makeGrid(5, 5),
  words: [{ number: '1', direction: 'across', row: '0', col: '0', length: '2', answer: '', hintText: '', hintEmoji: '' }],
}

function draftFromPuzzle(p: CrosswordPuzzle): Draft {
  const rows = p.grid.length
  const cols = p.grid[0]?.length ?? 0
  return {
    title: p.title,
    rows: String(rows),
    cols: String(cols),
    grid: p.grid.map((row) => row.map((c) => c ?? '')),
    words: p.words.map((w) => ({
      number: String(w.number),
      direction: w.direction,
      row: String(w.row),
      col: String(w.col),
      length: String(w.length),
      answer: w.answer,
      hintText: w.hintText,
      hintEmoji: w.hintEmoji,
    })),
  }
}

function draftToPuzzle(draft: Draft): Omit<CrosswordPuzzle, 'id'> {
  return {
    title: draft.title.trim(),
    grid: draft.grid.map((row) => row.map((c) => (c.trim() ? c.trim() : null))),
    words: draft.words
      .filter((w) => w.answer.trim())
      .map((w) => ({
        number: Number(w.number) || 0,
        direction: w.direction,
        row: Number(w.row) || 0,
        col: Number(w.col) || 0,
        length: Number(w.length) || w.answer.trim().length,
        answer: w.answer.trim(),
        hintText: w.hintText.trim(),
        hintEmoji: w.hintEmoji.trim(),
      })),
  }
}

const AI_WORD_COUNT = 8
const AI_MIN_PLACED = 5
const AI_MAX_ATTEMPTS = 3

const AI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    words: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          answer: { type: 'STRING' },
          hintText: { type: 'STRING' },
          hintEmoji: { type: 'STRING' },
        },
        required: ['answer', 'hintText', 'hintEmoji'],
      },
    },
  },
  required: ['words'],
}

function buildPrompt(category: string, hint: string): string {
  return `당신은 초등학생을 위한 "낱말퀴즈"(십자말풀이) 콘텐츠를 만드는 도우미입니다.

"${category}" 주제에 어울리는 한국어 낱말 ${AI_WORD_COUNT}개를 만들어주세요.
${hint.trim() ? `- 힌트: ${hint.trim()}` : ''}

조건:
- 각 낱말은 2~4글자의 한글 낱말이어야 해요 (예: "나무", "고양이", "고슴도치"). 외래어나 영어 표기, 조사가 붙은 형태는 피해주세요.
- 낱말퀴즈는 낱말들이 서로 글자를 공유하며 십자 모양으로 겹쳐져야 완성돼요. 그러니 ${AI_WORD_COUNT}개 중 여러 쌍이 같은 글자를 공유하도록 골라주세요 (예: "고양이"와 "고구마"는 첫 글자 "고"를 공유해요). 다른 낱말과 겹치는 글자가 전혀 없는 낱말은 피해주세요.
- 각 낱말마다 hintText(그 낱말을 설명하는 한 문장 힌트, 초등학생이 이해하기 쉬운 말투)와 hintEmoji(그 낱말을 나타내는 이모지 하나)를 함께 주세요.
- 다음 형식의 JSON으로만 답하세요: 정확히 ${AI_WORD_COUNT}개의 항목을 가진 words 배열. 각 항목은 answer, hintText, hintEmoji로 구성하세요.`
}

export default function CrosswordAdmin() {
  const [items, setItems] = useState<CrosswordPuzzle[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [aiCategory, setAiCategory] = useState('')
  const [aiHint, setAiHint] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const groups = useMemo(() => (items ? groupByCategory(items) : []), [items])
  const existingCategories = useMemo(
    () => Array.from(new Set((items ?? []).map((p) => categoryOf(p.title)))),
    [items],
  )

  function toggleCategory(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function reload() {
    listPuzzles().then(setItems)
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
    if (!aiCategory) setAiCategory(existingCategories[0] ?? '')
    setShowAiPanel(true)
  }

  function cancelAiPanel() {
    setShowAiPanel(false)
    setAiError(null)
  }

  async function handleGenerate() {
    const category = aiCategory.trim()
    if (!category) {
      setAiError('카테고리를 입력해주세요.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const key = await getGeminiApiKey()
      if (!key) {
        setShowApiKeyModal(true)
        return
      }

      let best: ReturnType<typeof generateCrosswordLayout> | null = null
      for (let i = 0; i < AI_MAX_ATTEMPTS; i++) {
        const result = await generateGeminiJSON<{ words: WordInput[] }>(key, buildPrompt(category, aiHint), AI_RESPONSE_SCHEMA)
        const candidates = result.words.filter((w) => w.answer && w.answer.trim().length >= 2)
        const layout = generateCrosswordLayout(candidates)
        if (!best || layout.words.length > best.words.length) best = layout
        if (best.words.length >= AI_MIN_PLACED) break
      }

      if (!best || best.words.length < AI_MIN_PLACED) {
        setAiError('낱말들이 서로 잘 연결되지 않아 낱말판을 만들지 못했어요. 다시 시도해주세요.')
        return
      }

      const nextNumber = items?.filter((p) => categoryOf(p.title) === category).length ?? 0
      setDraft({
        title: `${category} ${nextNumber + 1}`,
        rows: String(best.grid.length),
        cols: String(best.grid[0]?.length ?? 0),
        grid: best.grid.map((row) => row.map((c) => c ?? '')),
        words: best.words.map((w) => ({
          number: String(w.number),
          direction: w.direction,
          row: String(w.row),
          col: String(w.col),
          length: String(w.length),
          answer: w.answer,
          hintText: w.hintText,
          hintEmoji: w.hintEmoji,
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

  function startEdit(item: CrosswordPuzzle) {
    setDraft(draftFromPuzzle(item))
    setSaveError(null)
    setEditingId(item.id)
  }

  function cancel() {
    setEditingId(null)
  }

  function resizeTo(rowsText: string, colsText: string) {
    const rows = Math.max(1, Number(rowsText) || 1)
    const cols = Math.max(1, Number(colsText) || 1)
    setDraft((d) => ({ ...d, rows: rowsText, cols: colsText, grid: makeGrid(rows, cols, d.grid) }))
  }

  function setCell(r: number, c: number, value: string) {
    setDraft((d) => ({
      ...d,
      grid: d.grid.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value.slice(-1) : cell)) : row)),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const value = draftToPuzzle(draft)
      if (editingId === 'new') {
        await createPuzzle(value)
      } else if (editingId) {
        await updatePuzzle(editingId, value)
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
    if (!confirm('이 낱말퀴즈를 삭제할까요?')) return
    await deletePuzzle(id)
    reload()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin" className={styles.backLink} aria-label="관리자 홈으로">
          ⬅
        </Link>
        <h1 className={styles.title}>낱말퀴즈 관리</h1>
        <Link to="/" className={styles.homeLink} aria-label="홈으로 가기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>
      </header>

      {editingId ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <label>제목</label>
            <input type="text" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>낱말판 크기</p>
            <div className={styles.sizeFields}>
              <div className={styles.field}>
                <label>행 수</label>
                <input type="number" min={1} value={draft.rows} onChange={(e) => resizeTo(e.target.value, draft.cols)} />
              </div>
              <div className={styles.field}>
                <label>열 수</label>
                <input type="number" min={1} value={draft.cols} onChange={(e) => resizeTo(draft.rows, e.target.value)} />
              </div>
            </div>
            <p className={styles.hint}>칸에 글자를 입력하세요. 비워두면 막힌 칸이 돼요.</p>
            <div className={styles.gridEditor}>
              {draft.grid.map((row, r) => (
                <div key={r} className={styles.gridRow}>
                  {row.map((cell, c) => (
                    <input
                      key={c}
                      className={styles.gridCell}
                      value={cell}
                      maxLength={1}
                      onChange={(e) => setCell(r, c, e.target.value)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.subsection}>
            <p className={styles.subsectionTitle}>단어 목록</p>
            {draft.words.map((w, i) => (
              <div key={i} className={styles.itemRow}>
                <div className={styles.field}>
                  <label>번호</label>
                  <input
                    type="number"
                    value={w.number}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, number: e.target.value } : row)) }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>방향</label>
                  <select
                    value={w.direction}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        words: d.words.map((row, ri) =>
                          ri === i ? { ...row, direction: e.target.value as 'across' | 'down' } : row,
                        ),
                      }))
                    }
                  >
                    <option value="across">가로</option>
                    <option value="down">세로</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>시작 행</label>
                  <input
                    type="number"
                    value={w.row}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, row: e.target.value } : row)) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>시작 열</label>
                  <input
                    type="number"
                    value={w.col}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, col: e.target.value } : row)) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>글자 수</label>
                  <input
                    type="number"
                    value={w.length}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, length: e.target.value } : row)) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>정답</label>
                  <input
                    type="text"
                    value={w.answer}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, answer: e.target.value } : row)) }))}
                  />
                </div>
                <div className={styles.field} style={{ flex: '2 1 200px' }}>
                  <label>힌트 문장</label>
                  <input
                    type="text"
                    value={w.hintText}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, hintText: e.target.value } : row)) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>힌트 이모지</label>
                  <input
                    type="text"
                    value={w.hintEmoji}
                    onChange={(e) => setDraft((d) => ({ ...d, words: d.words.map((row, ri) => (ri === i ? { ...row, hintEmoji: e.target.value } : row)) }))}
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeRowButton}
                  onClick={() => setDraft((d) => ({ ...d, words: d.words.filter((_, ri) => ri !== i) }))}
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
                  words: [
                    ...d.words,
                    { number: String(d.words.length + 1), direction: 'across', row: '0', col: '0', length: '2', answer: '', hintText: '', hintEmoji: '' },
                  ],
                }))
              }
            >
              + 단어 추가
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
          <p className={styles.aiPanelTitle}>✨ AI로 낱말퀴즈 만들기</p>
          <div className={styles.field}>
            <label>카테고리</label>
            <input
              type="text"
              list="crossword-categories"
              value={aiCategory}
              onChange={(e) => setAiCategory(e.target.value)}
              placeholder="예: 동물과 자연 (기존 카테고리를 입력하면 이어서 추가돼요)"
            />
            <datalist id="crossword-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className={styles.field}>
            <label>힌트 (선택 — 비워두면 AI가 알아서 만들어요)</label>
            <textarea
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder="예: 바다 생물 위주로 만들어줘"
            />
          </div>
          <p className={styles.hint}>
            AI가 만든 낱말들을 자동으로 서로 겹치게 배치해요. 겹치지 않는 낱말은 낱말판에서 빠질 수 있어요.
          </p>
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
              + 새 낱말퀴즈 만들기
            </button>
            <button type="button" className={styles.aiButton} onClick={openAiPanel}>
              ✨ AI로 만들기
            </button>
          </div>

          {items === null ? (
            <p className={styles.empty}>불러오는 중이에요...</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>아직 낱말퀴즈가 없어요.</p>
          ) : (
            <div className={styles.list}>
              {groups.map(([category, groupItems]) => {
                const isOpen = openCategories.has(category)
                return (
                  <div key={category}>
                    <button
                      type="button"
                      className={styles.groupHeader}
                      aria-expanded={isOpen}
                      onClick={() => toggleCategory(category)}
                    >
                      <span className={styles.groupEmoji}>🔤</span>
                      <span className={styles.groupLabel}>{category}</span>
                      <span className={styles.groupCount}>{groupItems.length}개</span>
                      <span className={[styles.groupChevron, isOpen ? styles.groupChevronOpen : ''].join(' ')}>▾</span>
                    </button>
                    {isOpen && (
                      <div className={styles.groupBody}>
                        {groupItems.map((item) => (
                          <div key={item.id} className={styles.row}>
                            <span className={styles.rowTitle}>{item.title}</span>
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
