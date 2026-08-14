import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listStories, type Story } from './api'
import StoryPlayer from './StoryPlayer'
import styles from './StoryQuiz.module.css'

export default function StoryQuiz() {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [storyId, setStoryId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('storyAnswers')

  useEffect(() => {
    listStories().then(setStories)
  }, [])

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
          <p className={styles.intro}>듣고 싶은 이야기를 골라보세요</p>
          {stories.map((s) => (
            <button key={s.id} type="button" className={styles.storyCard} onClick={() => setStoryId(s.id)}>
              <span className={styles.storyEmoji}>{s.emoji}</span>
              <span className={styles.storyTitle}>{s.title}</span>
              {answers[s.id] !== undefined && (
                <span className={[styles.itemStatus, styles.statusDone].join(' ')}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Layout>
  )
}
