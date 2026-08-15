import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listStories, type Story } from './api'
import StoryPlayer from './StoryPlayer'
import styles from './StoryQuiz.module.css'

type StoryGroupKey = 'life' | 'proverb'

const GROUP_DEFS: { key: StoryGroupKey; label: string; emoji: string }[] = [
  { key: 'life', label: '생활 이야기', emoji: '🌼' },
  { key: 'proverb', label: '속담 이야기', emoji: '📜' },
]

// Stories don't carry a content-type field of their own -- the two flavors
// (original everyday-life stories vs. stories built around teaching a
// Korean proverb) only show up in the title/plot itself, so each id is
// hand-assigned here. Anything created later via the admin screen (random
// uuid ids) falls back to the 'life' bucket below.
const PROVERB_IDS = new Set([
  'easy-quiz-surprise',
  'small-village-champion',
  'five-fingers-love',
  'short-kid-wrestling',
  'well-frog-trip',
  'bike-lock-forgotten',
  'talk-of-the-tiger',
  'group-project-chaos',
  'quick-fix-tape',
  'loud-empty-boast',
  'ten-tries-tree',
  'thank-you-letter-power',
  'seedling-talent',
  'neighbors-bigger-kite',
  'shipping-cost-more-than-gift',
  'one-well-focus',
  'tadpole-forgets',
  'dog-after-three-years',
  'ask-even-known-path',
  'beads-must-be-strung',
  'drink-kimchi-soup-first',
  'ash-on-finished-rice',
  'egg-against-rock',
  'acorn-height-comparing',
  'crab-eyes-south-wind',
  'thirsty-digs-well',
  'no-news-good-news',
  'jar-with-no-bottom',
  'seeing-is-believing',
  'wound-then-medicine',
  'fanning-burning-house',
  'ground-hardens-after-rain',
  'carpenter-blames-tools',
  'time-is-medicine',
  'sail-with-tailwind',
  'failure-mother-success',
  'word-choice-nuance',
  'crying-baby-gets-milk',
  'rivals-meet-narrow-bridge',
  'worm-wriggles-when-stepped',
  'first-spoonful-full',
  'follow-friend-blindly',
  'arm-bends-inward',
  'no-grave-without-excuse',
  'sky-falls-hole-appears',
  'hoe-turns-into-shovel',
  'flowing-water-never-rots',
  'market-day-coincidence',
  'bell-on-cat-neck',
  'painting-of-rice-cake',
  'illiterate-of-basics',
  'good-for-both-sides',
  'extra-rice-cake-for-hated-child',
  'small-bird-follows-stork',
  'blood-of-bird-leg',
  'ox-needs-hill',
  'covering-sky-with-palm',
  'watermelon-surface-lick',
  'no-smoke-without-fire',
  'quiet-cat-first-on-stove',
  'dont-eye-impossible-tree',
  'smiling-face-no-spit',
  'thousand-mile-first-step',
  'young-puppy-fears-nothing',
])

function groupOf(story: Story): StoryGroupKey {
  return PROVERB_IDS.has(story.id) ? 'proverb' : 'life'
}

function groupStories(stories: Story[]) {
  return GROUP_DEFS.map((def) => ({ def, items: stories.filter((s) => groupOf(s) === def.key) })).filter(
    (g) => g.items.length > 0,
  )
}

export default function StoryQuiz() {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [openGroup, setOpenGroup] = useState<StoryGroupKey | null>(null)
  const [storyId, setStoryId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('storyAnswers')

  useEffect(() => {
    listStories().then(setStories)
  }, [])

  const groups = useMemo(() => (stories ? groupStories(stories) : []), [stories])
  const story = stories?.find((s) => s.id === storyId) ?? null

  return (
    <Layout title="내용이해" accentColor="var(--color-blue)">
      {stories === null ? (
        <p className={styles.intro}>불러오는 중이에요...</p>
      ) : story ? (
        <StoryPlayer
          key={story.id}
          story={story}
          onExit={() => setStoryId(null)}
          onFinish={() => recordAnswer(story.id, 1)}
        />
      ) : stories.length === 0 ? (
        <p className={styles.intro}>아직 이야기가 없어요. 관리자 화면에서 추가해주세요.</p>
      ) : (
        <div className={styles.list}>
          <p className={styles.intro}>듣고 싶은 이야기를 골라보세요 ({stories.length}개)</p>
          {groups.map(({ def, items }) => {
            const isOpen = openGroup === def.key
            return (
              <div key={def.key} className={styles.categoryGroup}>
                <button
                  type="button"
                  className={styles.storyCard}
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup((g) => (g === def.key ? null : def.key))}
                >
                  <span className={styles.storyEmoji}>{def.emoji}</span>
                  <span className={styles.storyTitle}>{def.label}</span>
                  <span className={styles.groupCount}>{items.length}개</span>
                  <span className={[styles.chevron, isOpen ? styles.chevronOpen : ''].join(' ')}>▾</span>
                </button>
                {isOpen && (
                  <div className={styles.subList}>
                    {items.map((s) => (
                      <button key={s.id} type="button" className={styles.subItem} onClick={() => setStoryId(s.id)}>
                        <span className={styles.subEmoji}>{s.emoji}</span>
                        <span className={styles.subTitle}>{s.title}</span>
                        {answers[s.id] !== undefined && (
                          <span className={[styles.itemStatus, styles.statusDone].join(' ')}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
