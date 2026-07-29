export interface ConversationMessage {
  speaker: 'A' | 'B'
  text?: string
  blank?: boolean
}

export interface ConversationChoice {
  label: string
  isEmoji?: boolean
}

export interface ConversationItem {
  id: string
  situation: string
  messages: ConversationMessage[]
  choices: ConversationChoice[]
  answerIndex: number
}

export const conversations: ConversationItem[] = [
  {
    id: 'reschedule',
    situation: '친구와 만나는 시간을 다시 정하고 있어요.',
    messages: [
      { speaker: 'A', text: '우리 3시에 놀이터에서 만나기로 했지?' },
      { speaker: 'B', text: '응! 근데 미안한데 4시로 늦춰도 될까?' },
      { speaker: 'A', blank: true },
      { speaker: 'B', text: '고마워! 이따 봐 😊' },
    ],
    choices: [
      { label: '괜찮아, 4시에 보자!' },
      { label: '싫어! 꼭 3시여야 해!' },
      { label: '너랑 안 놀아!' },
      { label: '그냥 취소하자' },
    ],
    answerIndex: 0,
  },
  {
    id: 'celebration',
    situation: '친구가 대회에서 1등을 했다고 자랑하고 있어요.',
    messages: [
      { speaker: 'A', text: '나 오늘 그리기 대회에서 1등 했어!' },
      { speaker: 'B', blank: true },
      { speaker: 'A', text: '헤헤, 고마워! 너무 기뻐!' },
    ],
    choices: [{ label: '🎉', isEmoji: true }, { label: '😴', isEmoji: true }, { label: '😡', isEmoji: true }, { label: '🙄', isEmoji: true }],
    answerIndex: 0,
  },
  {
    id: 'apology',
    situation: '친구의 블록을 실수로 무너뜨려서 사과하고 있어요.',
    messages: [
      { speaker: 'A', text: '미안해, 내가 실수로 네 블록을 넘어뜨렸어.' },
      { speaker: 'B', blank: true },
      { speaker: 'A', text: '고마워, 너 정말 착하다!' },
    ],
    choices: [
      { label: '괜찮아, 다시 만들면 돼!' },
      { label: '저리 가!' },
      { label: '다시는 너랑 안 놀아' },
      { label: '너 진짜 나빠' },
    ],
    answerIndex: 0,
  },
  {
    id: 'sharing-toy',
    situation: '친구가 장난감을 같이 쓰고 싶어 해요.',
    messages: [
      { speaker: 'A', text: '이 장난감 나도 같이 써도 돼?' },
      { speaker: 'B', blank: true },
      { speaker: 'A', text: '좋아! 같이 놀자!' },
    ],
    choices: [
      { label: '그래, 같이 쓰자!' },
      { label: '안 돼, 저리 가!' },
      { label: '싫어, 내 거야!' },
      { label: '말하지 않고 무시하기' },
    ],
    answerIndex: 0,
  },
  {
    id: 'empathy',
    situation: '친구가 아픈 강아지 때문에 속상해하고 있어요.',
    messages: [
      { speaker: 'A', text: '나 오늘 강아지가 아파서 병원에 갔어... 너무 속상해.' },
      { speaker: 'B', blank: true },
      { speaker: 'A', text: '그렇게 말해줘서 고마워, 마음이 좀 편해졌어.' },
    ],
    choices: [
      { label: '많이 속상하겠다, 강아지가 빨리 나았으면 좋겠어' },
      { label: '그게 뭐 대수야?' },
      { label: '나는 관심 없어' },
      { label: '빨리 딴 얘기하자' },
    ],
    answerIndex: 0,
  },
]
