import Layout from '../../components/Layout'
import ChoiceButton from '../../components/ChoiceButton'
import type { ConversationItem } from './api'
import styles from './ConversationBoard.module.css'

interface ConversationBoardProps {
  conversation: ConversationItem
  answer: number | undefined
  onAnswer: (choiceIndex: number) => void
  onExit: () => void
}

export default function ConversationBoard({ conversation, answer, onAnswer, onExit }: ConversationBoardProps) {
  const selected = answer ?? null

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      <p className={styles.situation}>{conversation.situation}</p>

      <div className={styles.chat}>
        {conversation.messages.map((msg, i) => {
          const isRight = msg.speaker === 'B'
          if (msg.blank) {
            const isCorrect = selected !== null && selected === conversation.answerIndex
            return (
              <div key={i} className={[styles.bubbleRow, isRight ? styles.right : styles.left].join(' ')}>
                <div
                  className={[
                    styles.bubble,
                    styles.blankBubble,
                    selected !== null ? (isCorrect ? styles.correctBubble : styles.wrongBubble) : '',
                  ].join(' ')}
                >
                  {selected !== null ? conversation.choices[selected].label : '❓ ・・・'}
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
      <div className={conversation.choices.some((c) => c.isEmoji) ? styles.choicesEmoji : styles.choices}>
        {conversation.choices.map((choice, i) => {
          let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
          if (selected !== null) {
            if (i === conversation.answerIndex) state = 'correct'
            else if (i === selected) state = 'wrong'
            else state = 'dimmed'
          }
          return (
            <ChoiceButton
              key={i}
              state={state}
              disabled={selected !== null}
              large={choice.isEmoji}
              onClick={() => onAnswer(i)}
            >
              {choice.label}
            </ChoiceButton>
          )
        })}
      </div>

      <button type="button" className={styles.exitLink} onClick={onExit}>
        다른 대화 고르기
      </button>
    </Layout>
  )
}
