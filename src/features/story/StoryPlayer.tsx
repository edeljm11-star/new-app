import { useMemo, useState } from 'react'
import EmojiScene from '../../components/EmojiScene'
import ChoiceButton from '../../components/ChoiceButton'
import BigButton from '../../components/BigButton'
import ProgressDots from '../../components/ProgressDots'
import ResultScreen from '../../components/ResultScreen'
import { useTTS } from '../../hooks/useTTS'
import type { Story } from './api'
import styles from './StoryPlayer.module.css'

type FlatQuestion =
  | { kind: 'tf'; prompt: string; choices: string[]; answerIndex: number }
  | { kind: 'theme'; prompt: string; choices: string[]; answerIndex: number }
  | { kind: 'vocab'; prompt: string; choices: string[]; answerIndex: number }
  | { kind: 'proverb'; prompt: string; choices: string[]; answerIndex: number }
  | { kind: 'synonym'; prompt: string; choices: string[]; answerIndex: number }
  | { kind: 'antonym'; prompt: string; choices: string[]; answerIndex: number }

const VOCAB_QUIZ_KIND: Record<NonNullable<Story['vocabQuiz'][number]['type']>, FlatQuestion['kind']> = {
  vocab: 'vocab',
  proverb: 'proverb',
  synonym: 'synonym',
  antonym: 'antonym',
}

const VOCAB_QUIZ_PROMPT: Record<FlatQuestion['kind'], (word: string) => string> = {
  tf: (word) => word,
  theme: (word) => word,
  vocab: (word) => `'${word}'의 뜻으로 알맞은 것은 무엇일까요?`,
  proverb: (word) => `'${word}'는 무슨 뜻일까요?`,
  synonym: (word) => `'${word}'와 비슷한 뜻을 가진 낱말은 무엇일까요?`,
  antonym: (word) => `'${word}'와 반대되는 뜻을 가진 낱말은 무엇일까요?`,
}

function buildQuestions(story: Story): FlatQuestion[] {
  const tf: FlatQuestion[] = story.trueFalse.map((item) => ({
    kind: 'tf',
    prompt: item.statement,
    choices: ['맞아요 (O)', '아니에요 (X)'],
    answerIndex: item.answer ? 0 : 1,
  }))
  const theme: FlatQuestion = {
    kind: 'theme',
    prompt: story.mainTheme.question,
    choices: story.mainTheme.choices,
    answerIndex: story.mainTheme.answerIndex,
  }
  const vocab: FlatQuestion[] = story.vocabQuiz.map((item) => {
    const kind = VOCAB_QUIZ_KIND[item.type ?? 'vocab']
    return {
      kind,
      prompt: VOCAB_QUIZ_PROMPT[kind](item.word),
      choices: item.choices,
      answerIndex: item.answerIndex,
    }
  })
  return [...tf, theme, ...vocab]
}

const kindLabel: Record<FlatQuestion['kind'], string> = {
  tf: '내용 일치',
  theme: '핵심 주제',
  vocab: '어휘 퀴즈',
  proverb: '속담 퀴즈',
  synonym: '비슷한말 퀴즈',
  antonym: '반대말 퀴즈',
}

interface StoryPlayerProps {
  story: Story
  onExit: () => void
}

export default function StoryPlayer({ story, onExit }: StoryPlayerProps) {
  const [stage, setStage] = useState<'reading' | 'quiz'>('reading')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const tts = useTTS()

  const questions = useMemo(() => buildQuestions(story), [story])
  const current = questions[index]
  const isLast = index === questions.length - 1

  const fullText = story.paragraphs.join(' ')

  function handlePlay() {
    if (tts.isPaused) {
      tts.resume()
    } else {
      tts.speak(fullText)
    }
  }

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
    tts.stop()
    setStage('reading')
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <ResultScreen score={score} total={questions.length} onRetry={handleRetry} onExit={onExit} exitLabel="다른 이야기 고르기" />
    )
  }

  if (stage === 'reading') {
    return (
      <div>
        <div className={styles.cover}>
          <EmojiScene scene={{ bg: 'var(--color-blue-soft)', items: [{ emoji: story.emoji, top: '50%', left: '50%', size: 64 }] }} />
        </div>
        <h2 className={styles.title}>{story.title}</h2>

        <div className={styles.ttsBar}>
          {tts.supported ? (
            <>
              <BigButton onClick={handlePlay} color="var(--color-blue)">
                {tts.isSpeaking && !tts.isPaused ? '🔊 읽는 중...' : '▶ 이야기 듣기'}
              </BigButton>
              {tts.isSpeaking && (
                <div className={styles.ttsControls}>
                  <button type="button" className={styles.ttsSmallBtn} onClick={tts.isPaused ? tts.resume : tts.pause}>
                    {tts.isPaused ? '이어 듣기' : '잠시 멈춤'}
                  </button>
                  <button type="button" className={styles.ttsSmallBtn} onClick={tts.stop}>
                    멈추기
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.ttsNote}>이 브라우저는 음성 듣기를 지원하지 않아요. 글로 읽어볼까요?</p>
          )}
        </div>

        <div className={styles.story}>
          {story.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className={styles.actions}>
          <BigButton
            onClick={() => {
              tts.stop()
              setStage('quiz')
            }}
          >
            문제 풀기 시작
          </BigButton>
          <button type="button" className={styles.exitLink} onClick={onExit}>
            다른 이야기 고르기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ProgressDots total={questions.length} current={index} />
      <p className={styles.kindLabel}>{kindLabel[current.kind]}</p>
      <p className={styles.question}>{current.prompt}</p>
      <div className={styles.choices}>
        {current.choices.map((choice, i) => {
          let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
          if (selected !== null) {
            if (i === current.answerIndex) state = 'correct'
            else if (i === selected) state = 'wrong'
            else state = 'dimmed'
          }
          return (
            <ChoiceButton key={i} state={state} disabled={selected !== null} onClick={() => handleSelect(i)}>
              {choice}
            </ChoiceButton>
          )
        })}
      </div>
      {selected !== null && (
        <div className={styles.actions}>
          <BigButton onClick={handleNext}>{isLast ? '결과 보기' : '다음 문제'}</BigButton>
        </div>
      )}
    </div>
  )
}
