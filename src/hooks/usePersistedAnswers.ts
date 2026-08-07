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

  // Overwrites on every call (not just the first) so retrying an item after
  // it's already been solved updates its badge to reflect the latest try.
  function recordAnswer(id: string, choiceIndex: number) {
    setAnswers((prev) => ({ ...prev, [id]: choiceIndex }))
  }

  return { answers, recordAnswer }
}
