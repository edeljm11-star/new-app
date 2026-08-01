import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listConversations, type ConversationItem } from './api'
import ConversationBoard from './ConversationBoard'
import styles from './ConversationQuiz.module.css'

// Conversations only carry a scene-setting sentence, not a short title, so
// known ids get a hand-picked label here. New items created later via the
// admin screen fall back to that sentence below.
const TITLES: Record<string, string> = {
  reschedule: '약속 시간 조율하기',
  celebration: '친구 소식 축하하기',
  apology: '실수 사과하기',
  'sharing-toy': '장난감 같이 쓰기',
  empathy: '아픈 강아지 위로하기',
  'keep-secret': '비밀 지키기',
  'topic-compromise': '모둠 발표 주제 의견 타협',
  'secret-slip': '비밀 누설 후 사과하기',
  'test-score-envy': '시험 점수 질투 다스리기',
  'new-hobby': '친구의 새 취미 경청하기',
}

function titleOf(item: ConversationItem): string {
  return TITLES[item.id] ?? item.situation
}

export default function ConversationQuiz() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('conversationAnswers')

  useEffect(() => {
    listConversations().then(setConversations)
  }, [])

  if (conversations === null) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (conversations.length === 0) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>아직 대화가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const open = conversations.find((c) => c.id === openId) ?? null

  if (open) {
    return (
      <ConversationBoard
        conversation={open}
        answer={answers[open.id]}
        onAnswer={(choiceIndex) => recordAnswer(open.id, choiceIndex)}
        onExit={() => setOpenId(null)}
      />
    )
  }

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      <p className={styles.intro}>풀고 싶은 대화를 골라보세요</p>
      <div className={styles.list}>
        {conversations.map((item) => {
          const answer = answers[item.id]
          const isCorrect = answer !== undefined && answer === item.answerIndex
          const isWrong = answer !== undefined && answer !== item.answerIndex
          return (
            <button key={item.id} type="button" className={styles.itemCard} onClick={() => setOpenId(item.id)}>
              <span className={styles.itemEmoji}>💬</span>
              <span className={styles.itemTitle}>{titleOf(item)}</span>
              {isCorrect && <span className={[styles.itemStatus, styles.statusCorrect].join(' ')}>✓</span>}
              {isWrong && <span className={[styles.itemStatus, styles.statusWrong].join(' ')}>✗</span>}
            </button>
          )
        })}
      </div>
    </Layout>
  )
}
