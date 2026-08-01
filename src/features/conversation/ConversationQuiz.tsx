import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import { useQuizProgress } from '../../hooks/useQuizProgress'
import { listConversations, type ConversationItem } from './api'
import styles from './ConversationQuiz.module.css'

export default function ConversationQuiz() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)

  useEffect(() => {
    listConversations().then(setConversations)
  }, [])

  const { index, answers, finished, hydrated, selectAnswer, goNext, goPrev, retry } = useQuizProgress(
    'conversationQuizProgress',
    conversations?.length ?? null,
  )

  if (conversations === null || !hydrated) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.situation}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (conversations.length === 0) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.situation}>아직 대화가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const current = conversations[index]
  const isLast = index === conversations.length - 1
  const selected = answers[index]
  const score = answers.reduce<number>((sum, a, i) => sum + (a === conversations[i].answerIndex ? 1 : 0), 0)

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      {finished ? (
        <ResultScreen score={score} total={conversations.length} onRetry={retry} />
      ) : (
        <>
          <ProgressDots total={conversations.length} current={index} />
          {index > 0 && (
            <button type="button" className={styles.prevButton} onClick={goPrev}>
              ← 이전 대화
            </button>
          )}
          <p className={styles.situation}>{current.situation}</p>

          <div className={styles.chat}>
            {current.messages.map((msg, i) => {
              const isRight = msg.speaker === 'B'
              if (msg.blank) {
                const isCorrect = selected !== null && selected === current.answerIndex
                return (
                  <div key={i} className={[styles.bubbleRow, isRight ? styles.right : styles.left].join(' ')}>
                    <div
                      className={[
                        styles.bubble,
                        styles.blankBubble,
                        selected !== null ? (isCorrect ? styles.correctBubble : styles.wrongBubble) : '',
                      ].join(' ')}
                    >
                      {selected !== null ? current.choices[selected].label : '❓ ・・・'}
                    </div>
                  </div>
                )
              }
              return (
                <div key={i} className={[styles.bubbleRow, isRight ? styles.right : styles.left].join(' ')}>
                  <div className={styles.bubble}>{msg.text}</div>
                </div>
              )
            })}
          </div>

          <p className={styles.prompt}>빈칸에 들어갈 알맞은 말을 골라보세요</p>
          <div
            className={
              current.choices.some((c) => c.isEmoji) ? styles.choicesEmoji : styles.choices
            }
          >
            {current.choices.map((choice, i) => {
              let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
              if (selected !== null) {
                if (i === current.answerIndex) state = 'correct'
                else if (i === selected) state = 'wrong'
                else state = 'dimmed'
              }
              return (
                <ChoiceButton
                  key={i}
                  state={state}
                  disabled={selected !== null}
                  large={choice.isEmoji}
                  onClick={() => selectAnswer(i)}
                >
                  {choice.label}
                </ChoiceButton>
              )
            })}
          </div>

          {selected !== null && (
            <div className={styles.actions}>
              <BigButton onClick={() => goNext(isLast)}>{isLast ? '결과 보기' : '다음 대화'}</BigButton>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
