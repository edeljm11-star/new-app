import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listPuzzles,
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
  type CrosswordPuzzle,
} from '../../features/crossword/api'
import { groupByCategory } from '../../features/crossword/grouping'
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

export default function CrosswordAdmin() {
  const [items, setItems] = useState<CrosswordPuzzle[] | null>(null)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  const groups = useMemo(() => (items ? groupByCategory(items) : []), [items])

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
    setEditingId('new')
  }

  function startEdit(item: CrosswordPuzzle) {
    setDraft(draftFromPuzzle(item))
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
    try {
      const value = draftToPuzzle(draft)
      if (editingId === 'new') {
        await createPuzzle(value)
      } else if (editingId) {
        await updatePuzzle(editingId, value)
      }
      setEditingId(null)
      reload()
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
            + 새 낱말퀴즈 만들기
          </button>

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
    </div>
  )
}
