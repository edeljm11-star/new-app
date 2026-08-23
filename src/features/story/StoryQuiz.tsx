import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listStories, type Story } from './api'
import { groupStories, type StoryGroupKey } from './grouping'
import StoryPlayer from './StoryPlayer'
import styles from './StoryQuiz.module.css'

export default function StoryQuiz() {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [openGroup, setOpenGroup] = useState<StoryGroupKey | null>(null)
  const { storyId } = useParams<{ storyId?: string }>()
  const navigate = useNavigate()
  const { answers, recordAnswer } = usePersistedAnswers('storyAnswers')

  useEffect(() => {
    listStories().then(setStories)
  }, [])

  const groups = useMemo(() => (stories ? groupStories(stories) : []), [stories])
  const story = stories?.find((s) => s.id === storyId) ?? null

  return (
    <Layout title="내용이해" accentColor="var(--color-blue)" backTo={story ? '/story' : '/'}>
      {stories === null ? (
        <p className={styles.intro}>불러오는 중이에요...</p>
      ) : story ? (
        <StoryPlayer
          key={story.id}
          story={story}
          onExit={() => navigate('/story')}
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
                      <button key={s.id} type="button" className={styles.subItem} onClick={() => navigate(`/story/${s.id}`)}>
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
