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
  'broken-item': '실수로 물건 망가뜨렸을 때',
  'new-student': '전학생 맞이하기',
  'lost-item': '소중한 물건을 잃어버렸을 때',
  'unfair-blame': '억울하게 오해받았을 때',
  'line-cutting': '새치기 대처하기',
  'not-picked': '편 가르기에서 마지막까지 남았을 때',
  'sibling-turn': '차례 기다리기',
  'compliment-jealousy': '친구가 칭찬받을 때',
  'promise-broken': '약속 어긴 친구 대하기',
  'accidental-hurt': '무심코 한 말로 상처 줬을 때',
  'cheating-on-test': '시험 중 커닝 상황',
  'chat-exclusion': '단체 채팅방 소외',
  'losing-competition': '대회에서 진 친구 위로하기',
  'plagiarism-temptation': '친구 과제 베끼고 싶은 유혹',
  'rumor-spreading': '헛소문이 퍼질 때',
  'class-pet-neglect': '학급 동물 돌봄 소홀',
  'found-money': '길에서 돈을 주웠을 때',
  'exam-stress-friend': '시험 스트레스 받는 친구',
  'sibling-comparison': '형제자매와 비교당할 때',
  'team-blame-game': '경기 진 뒤 친구 탓하기',
  'secret-diary-peek': '친구 일기장을 몰래 봤을 때',
  'language-barrier-student': '말이 서툰 전학생',
  'borrowed-item-broken': '빌린 물건을 망가뜨렸을 때',
  'appearance-teasing-witness': '외모 놀림 목격했을 때',
  'presentation-freeze': '발표 중 머릿속이 하얘질 때',
  'credit-hogging': '모둠 성과 혼자 차지하기',
  'online-mean-comment': '온라인 악플을 받았을 때',
  'unfair-scolding': '억울하게 혼났을 때',
  'wheelchair-friend-inclusion': '몸이 불편한 친구와 함께 놀기',
  'littering-witness': '쓰레기 무단 투기 목격',
}

function titleOf(item: SituationItem): string {
  return TITLES[item.id] ?? item.questions[0].question
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
          // Single-question items persist the picked choice index; multi-
          // question items persist the final score out of questions.length.
          const isSingle = item.questions.length === 1
          const isCorrect =
            answer !== undefined && (isSingle ? answer === item.questions[0].answerIndex : answer === item.questions.length)
          const isWrong = answer !== undefined && !isCorrect
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
