import { useState } from 'react'
import Layout from '../../components/Layout'
import { stories } from './data'
import StoryPlayer from './StoryPlayer'
import styles from './StoryQuiz.module.css'

export default function StoryQuiz() {
  const [storyId, setStoryId] = useState<string | null>(null)
  const story = stories.find((s) => s.id === storyId) ?? null

  return (
    <Layout title="내용이해" accentColor="var(--color-blue)">
      {story ? (
        <StoryPlayer key={story.id} story={story} onExit={() => setStoryId(null)} />
      ) : (
        <div className={styles.list}>
          <p className={styles.intro}>듣고 싶은 이야기를 골라보세요</p>
          {stories.map((s) => (
            <button key={s.id} type="button" className={styles.storyCard} onClick={() => setStoryId(s.id)}>
              <span className={styles.storyEmoji}>{s.emoji}</span>
              <span className={styles.storyTitle}>{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </Layout>
  )
}
