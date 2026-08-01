import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import EmojiScene from '../../components/EmojiScene'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import { useQuizProgress } from '../../hooks/useQuizProgress'
import { listSituations, type SituationItem } from './api'
import styles from './SituationQuiz.module.css'

export default function SituationQuiz() {
  const [situations, setSituations] = useState<SituationItem[] | null>(null)

  useEffect(() => {
    listSituations().then(setSituations)
  }, [])

  const { index, answers, finished, hydrated, selectAnswer, goNext, goPrev, retry } = useQuizProgress(
    'situationQuizProgress',
    situations?.length ?? null,
  )

  if (situations === null || !hydrated) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.question}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (situations.length === 0) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.question}>아직 문제가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const current = situations[index]
  const isLast = index === situations.length - 1
  const selected = answers[index]
  const score = answers.reduce<number>((sum, a, i) => sum + (a === situations[i].answerIndex ? 1 : 0), 0)

  return (
    <Layout title="상황추론" accentColor="var(--color-pink)">
      {finished ? (
        <ResultScreen score={score} total={situations.length} onRetry={retry} />
      ) : (
        <>
          <ProgressDots total={situations.length} current={index} />
          {index > 0 && (
            <button type="button" className={styles.prevButton} onClick={goPrev}>
              ← 이전 문제
            </button>
          )}
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
                <ChoiceButton key={i} state={state} onClick={() => selectAnswer(i)} disabled={selected !== null}>
                  {choice}
                </ChoiceButton>
              )
            })}
          </div>

          {selected !== null && (
            <div className={styles.feedback}>
              <p className={styles.explanation}>{current.explanation}</p>
              <BigButton onClick={() => goNext(isLast)}>{isLast ? '결과 보기' : '다음 문제'}</BigButton>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
