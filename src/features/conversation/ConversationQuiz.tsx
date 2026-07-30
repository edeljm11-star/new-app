import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import { listConversations, type ConversationItem } from './api'
import styles from './ConversationQuiz.module.css'

export default function ConversationQuiz() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    listConversations().then(setConversations)
  }, [])

  if (conversations === null) {
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

  function handleSelect(choiceIndex: number) {
    if (selected !== null) return
    setSelected(choiceIndex)
    if (choiceIndex === current.answerIndex) setScore((s) => s + 1)
  }

  function handleNext() {
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

  function handleRetry() {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      {finished ? (
        <ResultScreen score={score} total={conversations.length} onRetry={handleRetry} />
      ) : (
        <>
          <ProgressDots total={conversations.length} current={index} />
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
                  onClick={() => handleSelect(i)}
                >
                  {choice.label}
                </ChoiceButton>
              )
            })}
          </div>

          {selected !== null && (
            <div className={styles.actions}>
              <BigButton onClick={handleNext}>{isLast ? '결과 보기' : '다음 대화'}</BigButton>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
