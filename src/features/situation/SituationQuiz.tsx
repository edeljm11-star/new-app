import { useState } from 'react'
import Layout from '../../components/Layout'
import EmojiScene from '../../components/EmojiScene'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import { situations } from './data'
import styles from './SituationQuiz.module.css'

export default function SituationQuiz() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = situations[index]
  const isLast = index === situations.length - 1

  function handleSelect(choiceIndex: number) {
    if (selected !== null) return
    setSelected(choiceIndex)
    if (choiceIndex === current.answerIndex) {
      setScore((s) => s + 1)
    }
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
    <Layout title="상황추론" accentColor="var(--color-pink)">
      {finished ? (
        <ResultScreen score={score} total={situations.length} onRetry={handleRetry} />
      ) : (
        <>
          <ProgressDots total={situations.length} current={index} />
          <EmojiScene scene={current.scene} />
          <p className={styles.question}>{current.question}</p>
          <div className={styles.choices}>
            {current.choices.map((choice, i) => {
              let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
              if (selected !== null) {
                if (i === current.answerIndex) state = 'correct'
                else if (i === selected) state = 'wrong'
                else state = 'dimmed'
              }
              return (
                <ChoiceButton key={i} state={state} onClick={() => handleSelect(i)} disabled={selected !== null}>
                  {choice}
                </ChoiceButton>
              )
            })}
          </div>

          {selected !== null && (
            <div className={styles.feedback}>
              <p className={styles.explanation}>{current.explanation}</p>
              <BigButton onClick={handleNext}>{isLast ? '결과 보기' : '다음 문제'}</BigButton>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
