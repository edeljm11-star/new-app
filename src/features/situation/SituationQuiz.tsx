import { useEffect, useMemo, useState } from 'react'
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
  'jungle-gym-turn-pushed': '정글짐 순서에서 밀려난 친구',
  'lunchroom-tray-mess': '식판 정리 안 하고 가는 친구',
  'math-class-crying': '수학 문제 못 풀어 우는 친구',
  'art-show-missing-work': '전시 작품이 사라졌을 때',
  'stationery-shop-theft-witness': '문구점에서 훔치는 걸 목격했을 때',
  'playground-dog-fear': '강아지 무서워하는 친구 달래기',
  'new-cook-greeting': '새로 오신 조리사님께 인사하기',
  'library-adult-phonecall': '도서관에서 큰 소리로 통화하는 어른',
  'tug-of-war-weak-teasing': '줄다리기에서 진 친구 탓하기',
  'art-class-sharing-paper': '색종이 부족한 친구와 나누기',
  'online-class-camera-off': '온라인 수업에서 딴짓하는 친구',
  'jungle-gym-rescue': '정글짐에서 떨어질 뻔한 친구',
  'academy-homework-cover': '학원 숙제 안 해 온 친구',
  'stationery-checkout-cutting': '계산대에서 새치기당했을 때',
  'parade-seat-saving': '퍼레이드 자리 맡아 두기',
  'campfire-danger-stop': '캠프파이어에서 위험한 장난 말리기',
  'talent-show-stagefright': '장기자랑 무대 공포증',
  'soccer-injury-firstaid': '축구하다 다친 친구 돕기',
  'bus-motionsickness-medicine': '버스에서 멀미하는 친구 돕기',
  'pet-cafe-rough-handling': '반려동물 거칠게 만지는 손님',
  'bookstore-choice-advice': '서점에서 책 고르는 친구 돕기',
  'museum-visit-loud-group': '미술관에서 시끄러운 다른 학교 학생들',
  'class-newspaper-freerider': '학급 신문에서 혼자 일 안 하는 친구',
  'snowball-fight-hurt': '눈싸움에서 세게 던져 다치게 했을 때',
  'picnic-no-lunchbox': '소풍에서 도시락 안 가져온 친구',
  'flea-market-price-haggle': '벼룩시장에서 값 깎아 달라는 친구',
  'cheer-lost-voice-help': '응원하다 목소리 안 나오는 친구',
  'school-garden-harvest-share': '텃밭 수확물 나누기 다툼',
  'art-class-copying': '옆자리 그림 따라 그리는 친구',
  'slide-climbing-wrongway': '미끄럼틀 거꾸로 오르는 친구',
  'swim-class-dive-teasing': '잠수 못한다고 놀림당하는 친구',
  'class-magazine-review': '학급 문집 글이 별로라는 평가에 속상할 때',
  'group-chat-not-invited': '단체 채팅방에 초대받지 못했을 때',
  'park-bench-litter': '공원 벤치에 남겨진 쓰레기',
  'lunch-line-hungry-reason': '배고파서 새치기한 친구 이해하기',
  'crosswalk-signal-ignoring': '빨간불에 건너려는 친구 말리기',
  'art-supplies-left-messy': '미술 재료 어지럽히고 가는 친구',
  'classroom-plant-turn-dispute': '화분 물 주기 서로 미루기',
  'campfire-junior-scared': '캠프파이어 무서워하는 동생',
  'gazebo-adults-occupying': '정자를 오래 차지한 어른들',
  'library-return-forgotten-help': '책 반납일 깜빡한 친구 돕기',
  'tablet-class-broken-device': '태블릿 고장 난 친구 돕기',
  'cafeteria-food-waste': '급식 많이 남기고 버리는 친구',
  'bike-rental-no-helmet': '헬멧 안 쓰고 자전거 타는 친구',
  'presentation-mic-broken': '발표회에서 마이크 고장 났을 때',
  'cleanup-sharp-object': '봉사활동 중 날카로운 물건 발견',
  'ice-rink-fall-support': '스케이트 타다 넘어진 친구 돕기',
  'fishcake-treat-friend': '붕어빵 친구 몫까지 계산해 주기',
  'reading-club-unprepared': '독서 모임에 책 안 읽어 온 친구',
  'school-band-instrument-mixup': '밴드부 악기 뒤바뀌었을 때',
}

function titleOf(item: SituationItem): string {
  return TITLES[item.id] ?? item.questions[0].question
}

type SituationGroupKey =
  | 'help'
  | 'emotion'
  | 'conflict'
  | 'bullying'
  | 'consideration'
  | 'rules'
  | 'honesty'
  | 'manners'
  | 'teamwork'
  | 'etc'

const GROUP_DEFS: { key: SituationGroupKey; label: string; emoji: string }[] = [
  { key: 'help', label: '친구 돕기', emoji: '🤝' },
  { key: 'emotion', label: '감정 이해·위로', emoji: '💗' },
  { key: 'conflict', label: '갈등 해결', emoji: '🤔' },
  { key: 'bullying', label: '따돌림·놀림 대처', emoji: '🛡️' },
  { key: 'consideration', label: '배려·양보', emoji: '🌷' },
  { key: 'rules', label: '규칙·안전 지키기', emoji: '🚦' },
  { key: 'honesty', label: '정직·책임감', emoji: '✋' },
  { key: 'manners', label: '공공장소 예절', emoji: '🏛️' },
  { key: 'teamwork', label: '협동·모둠 활동', emoji: '👥' },
  { key: 'etc', label: '기타', emoji: '📌' },
]

// Situation ids don't carry any grouping info of their own, so each one is
// hand-assigned to a theme here. Anything created later via the admin screen
// (random uuid ids) falls back to the 'etc' bucket below.
const GROUP_OF: Record<string, SituationGroupKey> = {
  'fell-down': 'help',
  birthday: 'emotion',
  'no-umbrella': 'emotion',
  'toy-fight': 'conflict',
  'perfect-score': 'emotion',
  'group-project': 'teamwork',
  gossip: 'bullying',
  'team-sports': 'emotion',
  'borrow-item': 'honesty',
  bystander: 'bullying',
  'broken-item': 'honesty',
  'new-student': 'consideration',
  'lost-item': 'emotion',
  'unfair-blame': 'emotion',
  'line-cutting': 'rules',
  'not-picked': 'emotion',
  'sibling-turn': 'rules',
  'compliment-jealousy': 'emotion',
  'promise-broken': 'conflict',
  'accidental-hurt': 'honesty',
  'cheating-on-test': 'honesty',
  'chat-exclusion': 'bullying',
  'losing-competition': 'emotion',
  'plagiarism-temptation': 'honesty',
  'rumor-spreading': 'bullying',
  'class-pet-neglect': 'honesty',
  'found-money': 'honesty',
  'exam-stress-friend': 'emotion',
  'sibling-comparison': 'emotion',
  'team-blame-game': 'conflict',
  'secret-diary-peek': 'honesty',
  'language-barrier-student': 'consideration',
  'borrowed-item-broken': 'honesty',
  'appearance-teasing-witness': 'bullying',
  'presentation-freeze': 'emotion',
  'credit-hogging': 'teamwork',
  'online-mean-comment': 'bullying',
  'unfair-scolding': 'emotion',
  'wheelchair-friend-inclusion': 'consideration',
  'littering-witness': 'manners',
  'spilled-paint-artclass': 'help',
  'library-shelf-help': 'help',
  'swing-cutting-line': 'rules',
  'picky-eater-teasing': 'bullying',
  'pool-water-fear': 'emotion',
  'heavy-backpack-help': 'help',
  'science-experiment-mistake': 'help',
  'off-key-singing-tease': 'bullying',
  'dodgeball-selfblame': 'emotion',
  'academy-bus-seat': 'consideration',
  'stationery-store-mischarge': 'honesty',
  'amusement-park-scared-sibling': 'emotion',
  'camping-tent-teamwork': 'teamwork',
  'reading-room-noise': 'manners',
  'classroom-cleanup-alone': 'help',
  'bus-stop-rain-grandma': 'consideration',
  'museum-touching-artwork': 'manners',
  'soccer-foul-forgive': 'conflict',
  'sandcastle-destroyed': 'honesty',
  'classroom-meeting-ignored': 'emotion',
  'online-game-blame': 'conflict',
  'choir-practice-teasing': 'bullying',
  'volunteer-giving-up': 'emotion',
  'new-student-welcome-party': 'consideration',
  'field-trip-room-assignment': 'conflict',
  'vet-waiting-room-comfort': 'emotion',
  'salon-cutting-line': 'rules',
  'seesaw-weight-exclusion': 'bullying',
  'school-garden-watering': 'honesty',
  'lunch-line-junior-cutting': 'rules',
  'school-play-forgotten-line': 'help',
  'afterschool-alone-classroom': 'consideration',
  'stairs-junior-fall': 'help',
  'stationery-share-refused': 'emotion',
  'tag-game-rule-breaking': 'rules',
  'allergy-food-consideration': 'consideration',
  'fieldtrip-busmotionsick': 'help',
  'dogwalk-turn-conflict': 'conflict',
  'festival-booth-empty': 'emotion',
  'invention-idea-suspicion': 'conflict',
  'online-class-mic-mistake': 'honesty',
  'playground-bike-not-yielding': 'consideration',
  'class-library-book-damage': 'honesty',
  'taekwondo-belt-test-fail': 'emotion',
  'playground-shade-exhausted': 'help',
  'schoolstore-no-money': 'consideration',
  'quiz-contest-wrong-answer': 'emotion',
  'art-exhibit-low-score': 'emotion',
  'relay-race-baton-drop': 'emotion',
  'winter-camp-homesick': 'emotion',
  'jungle-gym-turn-pushed': 'rules',
  'lunchroom-tray-mess': 'manners',
  'math-class-crying': 'emotion',
  'art-show-missing-work': 'conflict',
  'stationery-shop-theft-witness': 'honesty',
  'playground-dog-fear': 'emotion',
  'new-cook-greeting': 'manners',
  'library-adult-phonecall': 'manners',
  'tug-of-war-weak-teasing': 'conflict',
  'art-class-sharing-paper': 'consideration',
  'online-class-camera-off': 'rules',
  'jungle-gym-rescue': 'help',
  'academy-homework-cover': 'honesty',
  'stationery-checkout-cutting': 'rules',
  'parade-seat-saving': 'rules',
  'campfire-danger-stop': 'rules',
  'talent-show-stagefright': 'emotion',
  'soccer-injury-firstaid': 'help',
  'bus-motionsickness-medicine': 'help',
  'pet-cafe-rough-handling': 'manners',
  'bookstore-choice-advice': 'help',
  'museum-visit-loud-group': 'manners',
  'class-newspaper-freerider': 'teamwork',
  'snowball-fight-hurt': 'honesty',
  'picnic-no-lunchbox': 'consideration',
  'flea-market-price-haggle': 'conflict',
  'cheer-lost-voice-help': 'help',
  'school-garden-harvest-share': 'conflict',
  'art-class-copying': 'honesty',
  'slide-climbing-wrongway': 'rules',
  'swim-class-dive-teasing': 'bullying',
  'class-magazine-review': 'emotion',
  'group-chat-not-invited': 'bullying',
  'park-bench-litter': 'manners',
  'lunch-line-hungry-reason': 'rules',
  'crosswalk-signal-ignoring': 'rules',
  'art-supplies-left-messy': 'teamwork',
  'classroom-plant-turn-dispute': 'teamwork',
  'campfire-junior-scared': 'emotion',
  'gazebo-adults-occupying': 'rules',
  'library-return-forgotten-help': 'help',
  'tablet-class-broken-device': 'help',
  'cafeteria-food-waste': 'manners',
  'bike-rental-no-helmet': 'rules',
  'presentation-mic-broken': 'help',
  'cleanup-sharp-object': 'rules',
  'ice-rink-fall-support': 'help',
  'fishcake-treat-friend': 'consideration',
  'reading-club-unprepared': 'teamwork',
  'school-band-instrument-mixup': 'conflict',
}

function groupOf(item: SituationItem): SituationGroupKey {
  return GROUP_OF[item.id] ?? 'etc'
}

function groupSituations(items: SituationItem[]) {
  return GROUP_DEFS.map((def) => ({ def, items: items.filter((item) => groupOf(item) === def.key) })).filter(
    (g) => g.items.length > 0,
  )
}

export default function SituationQuiz() {
  const [situations, setSituations] = useState<SituationItem[] | null>(null)
  const [openGroup, setOpenGroup] = useState<SituationGroupKey | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('situationAnswers')

  useEffect(() => {
    listSituations().then(setSituations)
  }, [])

  const groups = useMemo(() => (situations ? groupSituations(situations) : []), [situations])

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
        {groups.map(({ def, items }) => {
          const isOpen = openGroup === def.key
          return (
            <div key={def.key} className={styles.categoryGroup}>
              <button
                type="button"
                className={styles.itemCard}
                aria-expanded={isOpen}
                onClick={() => setOpenGroup((g) => (g === def.key ? null : def.key))}
              >
                <span className={styles.itemEmoji}>{def.emoji}</span>
                <span className={styles.itemTitle}>{def.label}</span>
                <span className={styles.groupCount}>{items.length}개</span>
                <span className={[styles.chevron, isOpen ? styles.chevronOpen : ''].join(' ')}>▾</span>
              </button>
              {isOpen && (
                <div className={styles.subList}>
                  {items.map((item) => {
                    const answer = answers[item.id]
                    // Single-question items persist the picked choice index; multi-
                    // question items persist the final score out of questions.length.
                    const isSingle = item.questions.length === 1
                    const isCorrect =
                      answer !== undefined &&
                      (isSingle ? answer === item.questions[0].answerIndex : answer === item.questions.length)
                    const isWrong = answer !== undefined && !isCorrect
                    return (
                      <button key={item.id} type="button" className={styles.subItem} onClick={() => setOpenId(item.id)}>
                        <span className={styles.subEmoji}>{item.scene.items[0]?.emoji ?? '🤔'}</span>
                        <span className={styles.subTitle}>{titleOf(item)}</span>
                        {isCorrect && <span className={[styles.itemStatus, styles.statusCorrect].join(' ')}>✓</span>}
                        {isWrong && <span className={[styles.itemStatus, styles.statusWrong].join(' ')}>✗</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
