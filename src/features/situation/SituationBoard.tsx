import { useState } from 'react'
import Layout from '../../components/Layout'
import EmojiScene from '../../components/EmojiScene'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import type { SituationCategory, SituationItem } from './api'
import styles from './SituationBoard.module.css'

const CATEGORY_LABEL: Record<SituationCategory, string> = {
  observe: '관찰',
  emotion: '감정',
  thought: '사고',
  apply: '적용',
}

interface SituationBoardProps {
  situation: SituationItem
  answer: number | undefined
  onAnswer: (score: number) => void
  onExit: () => void
}

export default function SituationBoard({ situation, answer, onAnswer, onExit }: SituationBoardProps) {
  const questions = situation.questions
  const isSingle = questions.length === 1

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = questions[index]
  const isLast = index === questions.length - 1

  // Single-question situations resolve their picked choice straight from the
  // persisted answer (no local state needed) -- this is exactly how the
  // screen worked before multi-question support existed.
  const singleSelected = isSingle ? (answer ?? null) : null

  function handleSelect(choiceIndex: number) {
    if (isSingle) {
      if (singleSelected !== null) return
      onAnswer(choiceIndex)
      return
    }
    if (selected !== null) return
    setSelected(choiceIndex)
    if (choiceIndex === current.answerIndex) setScore((s) => s + 1)
  }

  function handleNext() {
    if (isLast) {
      onAnswer(score)
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

  // Single-question situations (all the pre-existing content) keep the
  // original one-shot layout untouched: no progress bar, no result screen.
  if (isSingle) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <div className={styles.sceneWrap}>
          <EmojiScene scene={situation.scene} />
        </div>
        <p className={styles.question}>{current.question}</p>
        <div className={styles.choices}>
          {current.choices.map((choice, i) => {
            let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
            if (singleSelected !== null) {
              if (i === current.answerIndex) state = 'correct'
              else if (i === singleSelected) state = 'wrong'
              else state = 'dimmed'
            }
            return (
              <ChoiceButton key={i} state={state} onClick={() => handleSelect(i)} disabled={singleSelected !== null}>
                {choice}
              </ChoiceButton>
            )
          })}
        </div>

        {singleSelected !== null && (
          <div className={styles.feedback}>
            <p className={styles.explanation}>{current.explanation}</p>
          </div>
        )}

        <button type="button" className={styles.exitLink} onClick={onExit}>
          다른 문제 고르기
        </button>
      </Layout>
    )
  }

  if (finished) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <ResultScreen score={score} total={questions.length} onRetry={handleRetry} />
      </Layout>
    )
  }

  return (
    <Layout title="상황추론" accentColor="var(--color-pink)">
      <div className={styles.sceneWrap}>
        <EmojiScene scene={situation.scene} />
      </div>

      <ProgressDots total={questions.length} current={index} />
      {current.category && <p className={styles.categoryLabel}>{CATEGORY_LABEL[current.category]}</p>}
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
        <>
          <div className={styles.feedback}>
            <p className={styles.explanation}>{current.explanation}</p>
          </div>
          <div className={styles.actions}>
            <BigButton onClick={handleNext} color="var(--color-pink)">
              {isLast ? '결과 보기' : '다음 문제'}
            </BigButton>
          </div>
        </>
      )}

      <button type="button" className={styles.exitLink} onClick={onExit}>
        다른 문제 고르기
      </button>
    </Layout>
  )
}
