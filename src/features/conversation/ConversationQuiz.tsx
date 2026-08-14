import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { usePersistedAnswers } from '../../hooks/usePersistedAnswers'
import { listConversations, type ConversationItem } from './api'
import ConversationBoard from './ConversationBoard'
import styles from './ConversationQuiz.module.css'

// Conversations only carry a scene-setting sentence, not a short title, so
// known ids get a hand-picked label here. New items created later via the
// admin screen fall back to that sentence below.
const TITLES: Record<string, string> = {
  reschedule: '약속 시간 조율하기',
  celebration: '친구 소식 축하하기',
  apology: '실수 사과하기',
  'sharing-toy': '장난감 같이 쓰기',
  empathy: '아픈 강아지 위로하기',
  'keep-secret': '비밀 지키기',
  'topic-compromise': '모둠 발표 주제 의견 타협',
  'secret-slip': '비밀 누설 후 사과하기',
  'test-score-envy': '시험 점수 질투 다스리기',
  'new-hobby': '친구의 새 취미 경청하기',
  'group-role-conflict': '발표 역할 떠넘기기',
  'losing-game-graceful': '계속 지는 친구 위로하기',
  'borrowed-item-late': '빌린 책 늦게 돌려주기',
  'rumor-correction': '잘못된 소문 바로잡기',
  'exam-stress-comfort': '시험 앞둔 친구 다독이기',
  'cheating-temptation': '시험 중 답 보여달라는 부탁',
  'teamwork-praise': '밤늦게 준비해온 친구 칭찬하기',
  'exclusion-witness': '놀이에서 따돌림 목격하기',
  'screen-time-argument': '게임 시간 다투는 동생 말리기',
  'future-dream-share': '친구의 장래희망 들어주기',
  'chores-division': '집안일 분담 다투기',
  'surprise-party-plan': '깜짝 생일파티 준비하기',
  'losing-temper-apology': '화낸 뒤 사과하기',
  'new-transfer-student': '혼자인 전학생에게 다가가기',
  'environment-recycling': '분리수거 깜빡한 친구 알려주기',
  'compliment-effort': '상 못 받은 친구 노력 인정하기',
  'peer-pressure-refuse': '친구 놀리기 부추김 거절하기',
  'sports-team-loss': '시합 진 팀원 위로하기',
  'sibling-jealousy': '동생만 챙기는 것 같아 서운할 때',
  'thank-you-note': '도와준 친구에게 고마움 표현하기',
  'lost-pet-comfort': '강아지 잃어버린 친구 위로하기',
  'broken-friendship-repair': '다퉜던 친구와 화해하기',
  'group-chat-misunderstanding': '단체 채팅 오해 풀기',
  'volunteer-invite': '봉사활동 같이 가자는 권유',
  'losing-competition-fair': '대회에서 떨어진 친구 위로하기',
  'borrowing-money-refuse-politely': '돈 빌려달라는 부탁 거절하기',
  'class-election-support': '반장 선거 나간 친구 응원하기',
  'moving-away-farewell': '이사 가는 친구와 작별 인사',
  'video-game-addiction-concern': '게임에 빠진 친구 걱정하기',
  'unfair-grading-complaint': '억울한 채점에 속상한 친구 위로',
  'bragging-friend-response': '계속 자랑하는 친구 대하기',
  'helping-with-homework': '수학 숙제 도와주기',
  'weather-picnic-cancel': '소풍 취소돼 실망한 친구 달래기',
  'sharing-credit-teamwork': '발표 성과 혼자 차지하려는 친구',
  'losing-item-honesty': '주운 지갑 정직하게 처리하기',
  'body-image-comfort': '외모 놀림받은 친구 위로하기',
  'new-sibling-announcement': '동생 태어난다는 소식 들어주기',
  'project-deadline-panic': '마감 임박해 당황한 친구 돕기',
  'compliment-appearance-change': '바뀐 헤어스타일 칭찬하기',
  'giving-advice-crush': '짝사랑 고민 들어주기',
  'group-project-role-swap': '모둠 과제 역할 나누기',
  'lunch-tray-drop': '급식판 떨어뜨린 친구 돕기',
  'locker-combination-forgot': '사물함 비밀번호 잊은 친구 돕기',
  'book-recommendation': '재미있는 책 추천하기',
  'rainy-day-umbrella-share': '우산 같이 쓰자고 하기',
  'field-day-team-pick': '체육대회 팀 정하기',
  'birthday-gift-idea': '생일 선물 고민 상담하기',
  'class-pet-turn': '학급 동물 돌봄 순서 챙기기',
  'video-game-strategy': '게임 전략 상의하기',
  'moving-seat-request': '짝꿍에게 자리 바꿔달라 하기',
  'forgot-homework-teacher': '깜빡한 숙제 선생님께 말씀드리기',
  'field-trip-permission': '현장학습 신청서 문의하기',
  'computer-error-help': '컴퓨터 문제 도움 요청하기',
  'presentation-nervous': '발표 앞두고 긴장 상담하기',
  'lost-textbook-teacher': '잃어버린 교과서 문의하기',
  'extra-credit-question': '추가 점수 방법 여쭤보기',
  'seat-change-request-teacher': '자리 배치 요청하기',
  'club-activity-signup': '동아리 가입 문의하기',
  'makeup-test-request': '보충 시험 요청하기',
  'reading-recommendation-teacher': '선생님께 책 추천받기',
  'stomach-ache-doctor': '배 아파서 진료받기',
  'broken-arm-checkup': '다친 팔 진료받기',
  'allergy-checkup': '알레르기 검사받기',
  'dental-checkup': '치과에서 진료받기',
  'flu-symptoms': '독감 증상 진료받기',
  'eye-checkup': '시력 검사받기',
  'bookstore-recommendation': '서점에서 책 추천받기',
  'shoe-size-exchange': '신발 사이즈 교환하기',
  'bakery-order': '빵집에서 빵 주문하기',
  'lost-and-found-store': '가게에 두고 온 물건 찾기',
  'sporting-goods-advice': '운동용품 추천받기',
  'pet-shop-question': '애완동물 용품 문의하기',
  'parent-curfew-negotiate': '귀가 시간 부모님과 정하기',
  'sibling-toy-sharing': '장난감 두고 동생과 다투기',
  'parent-grade-report': '성적표 부모님께 보여드리기',
  'sibling-homework-help': '동생 숙제 도와주기',
  'family-trip-planning': '가족 여행 계획 상의하기',
  'parent-allowance-request': '용돈 올려달라 부탁하기',
  'sibling-room-share': '방 같이 쓰는 규칙 정하기',
  'parent-pet-request': '반려동물 키우고 싶다 조르기',
  'coach-team-strategy': '코치와 경기 작전 상의하기',
  'librarian-book-search': '사서 선생님께 책 찾아달라 하기',
  'neighbor-noise-apology': '층간소음 이웃에게 사과하기',
  'bus-driver-question': '버스 기사님께 정류장 여쭤보기',
  'vet-pet-checkup': '반려동물 건강 검진받기',
  'online-chat-misunderstanding-emoji': '단체 채팅 오해 이모티콘으로 풀기',
  'video-call-lag-emoji': '화상 수업 화면 문제 해결하기',
  'game-invite-emoji': '같이 게임하자고 초대하기',
  'online-class-question-emoji': '온라인 수업 중 질문하기',
  'social-media-comment-emoji': '친구 게시물에 이모티콘 반응하기',
}

function titleOf(item: ConversationItem): string {
  return TITLES[item.id] ?? item.situation
}

export default function ConversationQuiz() {
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { answers, recordAnswer } = usePersistedAnswers('conversationAnswers')

  useEffect(() => {
    listConversations().then(setConversations)
  }, [])

  if (conversations === null) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>불러오는 중이에요...</p>
      </Layout>
    )
  }

  if (conversations.length === 0) {
    return (
      <Layout title="대화추론" accentColor="var(--color-primary)">
        <p className={styles.intro}>아직 대화가 없어요. 관리자 화면에서 추가해주세요.</p>
      </Layout>
    )
  }

  const open = conversations.find((c) => c.id === openId) ?? null

  if (open) {
    return (
      <ConversationBoard
        conversation={open}
        onAnswer={(choiceIndex) => recordAnswer(open.id, choiceIndex)}
        onExit={() => setOpenId(null)}
      />
    )
  }

  return (
    <Layout title="대화추론" accentColor="var(--color-primary)">
      <p className={styles.intro}>풀고 싶은 대화를 골라보세요 ({conversations.length}개)</p>
      <div className={styles.list}>
        {conversations.map((item) => {
          const answer = answers[item.id]
          const isCorrect = answer !== undefined && answer === item.answerIndex
          const isWrong = answer !== undefined && answer !== item.answerIndex
          return (
            <button key={item.id} type="button" className={styles.itemCard} onClick={() => setOpenId(item.id)}>
              <span className={styles.itemEmoji}>💬</span>
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
