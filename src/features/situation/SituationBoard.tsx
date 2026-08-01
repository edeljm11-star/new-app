import Layout from '../../components/Layout'
import EmojiScene from '../../components/EmojiScene'
import ChoiceButton from '../../components/ChoiceButton'
import type { SituationItem } from './api'
import styles from './SituationBoard.module.css'

interface SituationBoardProps {
  situation: SituationItem
  answer: number | undefined
  onAnswer: (choiceIndex: number) => void
  onExit: () => void
}

export default function SituationBoard({ situation, answer, onAnswer, onExit }: SituationBoardProps) {
  const selected = answer ?? null

  return (
    <Layout title="상황추론" accentColor="var(--color-pink)">
      <EmojiScene scene={situation.scene} />
      <p className={styles.question}>{situation.question}</p>
      <div className={styles.choices}>
        {situation.choices.map((choice, i) => {
          let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
          if (selected !== null) {
            if (i === situation.answerIndex) state = 'correct'
            else if (i === selected) state = 'wrong'
            else state = 'dimmed'
          }
          return (
            <ChoiceButton key={i} state={state} onClick={() => onAnswer(i)} disabled={selected !== null}>
              {choice}
            </ChoiceButton>
          )
        })}
      </div>

      {selected !== null && (
        <div className={styles.feedback}>
          <p className={styles.explanation}>{situation.explanation}</p>
        </div>
      )}

      <button type="button" className={styles.exitLink} onClick={onExit}>
        다른 문제 고르기
      </button>
    </Layout>
  )
}
