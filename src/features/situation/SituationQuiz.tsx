import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listSituations, type SituationItem } from './api'
import SituationBoard from './SituationBoard'
import styles from './SituationQuiz.module.css'

// Situations don't have a short title of their own (only a full question
// sentence), so known ids get a hand-picked label here. Anything created
// later via the admin screen falls back to its question text below.
const TITLES: Record<string, string> = {
  'fell-down': '넘어진 친구 돕기',
  birthday: '생일 파티 알아채기',
  'no-umbrella': '우산 없이 비를 맞을 때',
  'toy-fight': '장난감 다툼 해결하기',
  'perfect-score': '시험 잘 봤을 때 기분',
  'group-project': '모둠 과제 갈등',
  gossip: '친구 뒷담화 대처하기',
  'team-sports': '진 팀 친구 위로하기',
  'borrow-item': '빌린 준비물 책임지기',
  bystander: '따돌림 목격했을 때',
}

function titleOf(item: SituationItem): string {
  return TITLES[item.id] ?? item.question
}

export default function SituationQuiz() {
  const [situations, setSituations] = useState<SituationItem[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('situationAnswers')

  useEffect(() => {
    listSituations().then(setSituations)
  }, [])

  if (situations === null) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.intro}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (situations.length === 0) {
    return (
      <Layout title="상황추론" accentColor="var(--color-pink)">
        <p className={styles.intro}>아직 문제가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const open = situations.find((s) => s.id === openId) ?? null

  if (open) {
    return (
      <SituationBoard
        situation={open}
        answer={answers[open.id]}
        onAnswer={(choiceIndex) => recordAnswer(open.id, choiceIndex)}
        onExit={() => setOpenId(null)}
      />
    )
  }

  return (
    <Layout title="상황추론" accentColor="var(--color-pink)">
      <p className={styles.intro}>풀고 싶은 문제를 골라보세요</p>
      <div className={styles.list}>
        {situations.map((item) => {
          const answer = answers[item.id]
          const isCorrect = answer !== undefined && answer === item.answerIndex
          const isWrong = answer !== undefined && answer !== item.answerIndex
          return (
            <button key={item.id} type="button" className={styles.itemCard} onClick={() => setOpenId(item.id)}>
              <span className={styles.itemEmoji}>{item.scene.items[0]?.emoji ?? '🤔'}</span>
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
