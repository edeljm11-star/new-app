import type { EmojiSceneSpec } from '../../components/EmojiScene'

export interface SituationItem {
  id: string
  scene: EmojiSceneSpec
  question: string
  choices: string[]
  answerIndex: number
  explanation: string
}

export const situations: SituationItem[] = [
  {
    id: 'fell-down',
    scene: {
      bg: 'var(--color-pink-soft)',
      items: [
        { emoji: '🤕', top: '45%', left: '35%', size: 72 },
        { emoji: '🧍', top: '60%', left: '75%', size: 60 },
        { emoji: '😟', top: '28%', left: '75%', size: 34 },
      ],
    },
    question: '친구가 넘어져서 아파해요. 어떻게 하면 좋을까요?',
    choices: [
      '다가가서 괜찮은지 물어봐요',
      '못 본 척 지나가요',
      '친구를 보고 웃어요',
      '더 세게 밀어요',
    ],
    answerIndex: 0,
    explanation: '다친 친구를 도와주면 친구가 고마워할 거예요.',
  },
  {
    id: 'birthday',
    scene: {
      bg: 'var(--color-yellow-soft)',
      items: [
        { emoji: '🥳', top: '58%', left: '32%', size: 66 },
        { emoji: '🎂', top: '68%', left: '68%', size: 58 },
        { emoji: '🎈', top: '18%', left: '20%', size: 42 },
        { emoji: '🎈', top: '18%', left: '80%', size: 42 },
        { emoji: '🎁', top: '30%', left: '52%', size: 40 },
      ],
    },
    question: '이 그림은 어떤 날일까요?',
    choices: [
      '친구의 생일이에요',
      '친구가 많이 아파요',
      '학교에 가는 날이에요',
      '잠을 자는 시간이에요',
    ],
    answerIndex: 0,
    explanation: '케이크와 풍선, 선물이 있으면 생일 파티예요.',
  },
  {
    id: 'no-umbrella',
    scene: {
      bg: 'var(--color-blue-soft)',
      items: [
        { emoji: '🌧️', top: '22%', left: '50%', size: 58 },
        { emoji: '🧒', top: '68%', left: '50%', size: 66 },
        { emoji: '💧', top: '45%', left: '22%', size: 26 },
        { emoji: '💧', top: '45%', left: '78%', size: 26 },
      ],
    },
    question: '우산이 없어서 비를 맞게 생겼어요. 아이의 마음은 어떨까요?',
    choices: ['속상하고 걱정돼요', '신나고 즐거워요', '아주 자랑스러워요', '졸리고 심심해요'],
    answerIndex: 0,
    explanation: '비를 맞으면 춥고 옷이 젖을 수 있어서 속상한 마음이 들어요.',
  },
  {
    id: 'toy-fight',
    scene: {
      bg: 'var(--color-purple-soft)',
      items: [
        { emoji: '🧒', top: '58%', left: '22%', size: 62 },
        { emoji: '🧸', top: '55%', left: '50%', size: 54 },
        { emoji: '🧒', top: '58%', left: '78%', size: 62 },
        { emoji: '💢', top: '20%', left: '50%', size: 36 },
      ],
    },
    question: '두 친구가 장난감 하나를 두고 다투고 있어요. 가장 좋은 방법은 무엇일까요?',
    choices: [
      '번갈아 가며 사이좋게 써요',
      '장난감을 던져버려요',
      '친구를 밀어요',
      '혼자 다 가져가요',
    ],
    answerIndex: 0,
    explanation: '사이좋게 나누어 쓰면 둘 다 기분 좋게 놀 수 있어요.',
  },
  {
    id: 'perfect-score',
    scene: {
      bg: 'var(--color-primary-soft)',
      items: [
        { emoji: '🥳', top: '58%', left: '50%', size: 72 },
        { emoji: '📄', top: '78%', left: '22%', size: 40 },
        { emoji: '💯', top: '20%', left: '50%', size: 46 },
        { emoji: '⭐', top: '32%', left: '22%', size: 26 },
        { emoji: '⭐', top: '32%', left: '78%', size: 26 },
      ],
    },
    question: '아이가 시험에서 좋은 점수를 받고 활짝 웃고 있어요. 지금 기분은 어떨까요?',
    choices: ['아주 기쁘고 뿌듯해요', '슬프고 속상해요', '무섭고 겁이 나요', '화가 나고 짜증나요'],
    answerIndex: 0,
    explanation: '노력한 만큼 좋은 결과가 나오면 기쁘고 뿌듯한 마음이 들어요.',
  },
]
