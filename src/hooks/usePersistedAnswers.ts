import { useEffect, useState } from 'react'

// Remembers which quiz item (by id) the learner has already answered and
// with what choice, so a list-of-items screen can show a solved/unsolved
// badge per item across visits without needing a linear in-progress index.
export function usePersistedAnswers(storageKey: string) {
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers))
  }, [storageKey, answers])

  function recordAnswer(id: string, choiceIndex: number) {
    setAnswers((prev) => (id in prev ? prev : { ...prev, [id]: choiceIndex }))
  }

  return { answers, recordAnswer }
}
