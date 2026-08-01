import { useEffect, useState } from 'react'

interface StoredProgress {
  index: number
  answers: (number | null)[]
  finished: boolean
}

// Remembers where the learner left off in a linear, score-as-you-go quiz
// (leaving the page and coming back resumes instead of restarting at 1),
// while still supporting stepping back to review an already-answered question.
export function useQuizProgress(storageKey: string, total: number | null) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [finished, setFinished] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (total === null || hydrated) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      const parsed = raw ? (JSON.parse(raw) as StoredProgress) : null
      if (parsed && Array.isArray(parsed.answers) && parsed.answers.length === total) {
        setIndex(Math.min(Math.max(parsed.index, 0), total - 1))
        setAnswers(parsed.answers)
        setFinished(parsed.finished)
        setHydrated(true)
        return
      }
    } catch {
      // corrupt/old storage shape, fall through to a fresh start
    }
    setAnswers(Array(total).fill(null))
    setHydrated(true)
  }, [total, hydrated, storageKey])

  useEffect(() => {
    if (!hydrated) return
    const progress: StoredProgress = { index, answers, finished }
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [hydrated, storageKey, index, answers, finished])

  function selectAnswer(choiceIndex: number) {
    setAnswers((prev) => {
      if (prev[index] !== null) return prev
      const next = [...prev]
      next[index] = choiceIndex
      return next
    })
  }

  function goNext(isLast: boolean) {
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  function retry() {
    setIndex(0)
    setFinished(false)
    setAnswers(total !== null ? Array(total).fill(null) : [])
  }

  return { index, answers, finished, hydrated, selectAnswer, goNext, goPrev, retry }
}
