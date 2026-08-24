import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from './useSession'

// Remembers which quiz item (by id) the learner has already answered and
// with what value (a picked choice index, a score out of N, or a plain
// "done" flag depending on the feature), so a list-of-items screen can show
// a solved/unsolved badge per item. Backed by Supabase (per-user, RLS-scoped)
// rather than localStorage, so progress follows the account across devices
// instead of being stuck on one browser.
export function usePersistedAnswers(feature: string) {
  const { session } = useSession()
  const userId = session?.user.id
  const [answers, setAnswers] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('user_progress')
        .select('item_id, value')
        .eq('user_id', userId)
        .eq('feature', feature)
      if (error || cancelled) return

      let merged = Object.fromEntries(data.map((row) => [row.item_id, row.value]))

      // One-time migration: a fresh account (no rows yet for this feature)
      // may still have progress from the old localStorage-only version --
      // upload it once so it isn't silently lost. Safe to repeat (upsert).
      if (data.length === 0) {
        const local = readLocalAnswers(feature)
        const entries = Object.entries(local)
        if (entries.length > 0) {
          merged = local
          await supabase
            .from('user_progress')
            .upsert(
              entries.map(([itemId, value]) => ({ user_id: userId, feature, item_id: itemId, value })),
              { onConflict: 'user_id,feature,item_id' },
            )
        }
      }

      if (!cancelled) setAnswers(merged)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [feature, userId])

  // Overwrites on every call (not just the first) so retrying an item after
  // it's already been solved updates its badge to reflect the latest try.
  function recordAnswer(id: string, value: number) {
    if (!userId) return
    setAnswers((prev) => ({ ...prev, [id]: value }))
    void supabase
      .from('user_progress')
      .upsert({ user_id: userId, feature, item_id: id, value }, { onConflict: 'user_id,feature,item_id' })
  }

  return { answers, recordAnswer }
}

function readLocalAnswers(feature: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(feature)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}
