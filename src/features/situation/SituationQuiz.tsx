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
  'spilled-paint-artclass': '물감 쏟은 짝꿍 돕기',
  'library-shelf-help': '도서관에서 책 찾는 친구 돕기',
  'swing-cutting-line': '그네 순서 새치기 대처하기',
  'picky-eater-teasing': '편식한다고 놀림당하는 친구',
  'pool-water-fear': '물 무서워하는 친구 응원하기',
  'heavy-backpack-help': '무거운 가방 든 친구 돕기',
  'science-experiment-mistake': '실험 실수한 친구 감싸기',
  'off-key-singing-tease': '음정 틀렸다고 놀림당할 때',
  'dodgeball-selfblame': '피구에서 자책하는 친구 위로하기',
  'academy-bus-seat': '버스에서 자리 양보하기',
  'stationery-store-mischarge': '거스름돈 더 받았을 때',
  'amusement-park-scared-sibling': '놀이기구 무서워하는 동생',
  'camping-tent-teamwork': '캠핑장 텐트 함께 정리하기',
  'reading-room-noise': '독서실에서 떠드는 친구',
  'classroom-cleanup-alone': '혼자 남아 청소하는 친구 돕기',
  'bus-stop-rain-grandma': '비 맞는 할머니께 우산 나눠드리기',
  'museum-touching-artwork': '전시 작품 함부로 만지려 할 때',
  'soccer-foul-forgive': '반칙한 상대 팀 용서하기',
  'sandcastle-destroyed': '모래성 무너뜨렸을 때 사과하기',
  'classroom-meeting-ignored': '학급 회의에서 의견 무시당할 때',
  'online-game-blame': '온라인 게임에서 팀원 탓하기',
  'choir-practice-teasing': '합창 연습에서 음 놓쳐 놀림당할 때',
  'volunteer-giving-up': '봉사활동 힘들어하는 친구 격려하기',
  'new-student-welcome-party': '전학생 환영 파티 준비하기',
  'field-trip-room-assignment': '수학여행 방 배정 갈등',
  'vet-waiting-room-comfort': '동물병원에서 우는 동생 위로하기',
  'salon-cutting-line': '미용실에서 새치기 목격하기',
  'seesaw-weight-exclusion': '몸무게 차이로 시소 놀이 소외',
  'school-garden-watering': '텃밭 물주기 깜빡했을 때',
  'lunch-line-junior-cutting': '급식 줄 새치기하는 후배',
  'school-play-forgotten-line': '학예회에서 대사 잊은 친구 돕기',
  'afterschool-alone-classroom': '방과후 혼자 남은 친구',
  'stairs-junior-fall': '계단에서 넘어진 동생 돕기',
  'stationery-share-refused': '연필 빌려주기 거절당했을 때',
  'tag-game-rule-breaking': '술래잡기 규칙 어기는 친구',
  'allergy-food-consideration': '알레르기 있는 친구 배려하기',
  'fieldtrip-busmotionsick': '체험학습 버스에서 멀미하는 친구',
  'dogwalk-turn-conflict': '반려견 산책 순서 다투기',
  'festival-booth-empty': '축제 부스에 손님이 없을 때',
  'invention-idea-suspicion': '발명품 아이디어 비슷해서 의심될 때',
  'online-class-mic-mistake': '온라인 수업 마이크 실수',
  'playground-bike-not-yielding': '자전거 양보 안 하는 친구',
  'class-library-book-damage': '학급문고 책 찢고 숨기기',
  'taekwondo-belt-test-fail': '승급 심사 떨어진 친구 위로하기',
  'playground-shade-exhausted': '더위에 지친 친구 챙기기',
  'schoolstore-no-money': '매점에서 돈 없는 친구 배려하기',
  'quiz-contest-wrong-answer': '퀴즈대회에서 오답 낸 친구',
  'art-exhibit-low-score': '미술 전시 낮은 평가에 실망한 친구',
  'relay-race-baton-drop': '이어달리기 배턴 놓친 친구',
  'winter-camp-homesick': '캠프에서 향수병 걸린 친구',
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
      <p className={styles.intro}>풀고 싶은 문제를 골라보세요 ({situations.length}개)</p>
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
