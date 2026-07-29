export interface Vocabulary {
  word: string
  meaning: string
}

export interface TrueFalseItem {
  statement: string
  answer: boolean
}

export interface MainThemeQuiz {
  question: string
  choices: string[]
  answerIndex: number
}

export interface VocabQuizItem {
  word: string
  choices: string[]
  answerIndex: number
}

export interface Story {
  id: string
  emoji: string
  title: string
  paragraphs: string[]
  vocabulary: Vocabulary[]
  trueFalse: TrueFalseItem[]
  mainTheme: MainThemeQuiz
  vocabQuiz: VocabQuizItem[]
}

export const stories: Story[] = [
  {
    id: 'first-errand',
    emoji: '🥕',
    title: '토리의 첫 심부름',
    paragraphs: [
      '토리는 오늘 처음으로 혼자 심부름을 가기로 했어요.',
      '엄마는 토리에게 두부 한 모를 사 오라고 했어요.',
      '토리는 씩씩하게 가게로 걸어갔어요.',
      '가게에 도착했더니 두부가 다 팔리고 없었어요.',
      '토리는 속상했지만 울지 않고 다른 가게를 찾아보기로 했어요.',
      '옆 가게에서 드디어 두부를 찾았어요.',
      '토리는 두부를 안전하게 들고 집으로 돌아왔어요.',
      '엄마는 토리를 꼭 안아주며 정말 잘했다고 칭찬했어요.',
      '토리는 스스로 해냈다는 생각에 마음이 뿌듯했어요.',
    ],
    vocabulary: [
      { word: '심부름', meaning: '다른 사람이 시킨 일을 대신 하는 것' },
      { word: '속상하다', meaning: '마음이 아프고 안 좋다' },
      { word: '뿌듯하다', meaning: '마음이 흐뭇하고 자랑스럽다' },
    ],
    trueFalse: [
      { statement: '토리는 오늘 혼자 심부름을 갔어요.', answer: true },
      { statement: '토리는 사탕을 사러 갔어요.', answer: false },
      { statement: '첫 번째 가게에는 두부가 있었어요.', answer: false },
      { statement: '토리는 결국 두부를 사서 집에 돌아왔어요.', answer: true },
    ],
    mainTheme: {
      question: '이 이야기가 말하고 싶은 것은 무엇일까요?',
      choices: [
        '포기하지 않고 끝까지 해내면 뿌듯함을 느낄 수 있어요',
        '심부름은 힘든 일이니 하지 않는 게 좋아요',
        '두부는 맛이 없어요',
        '엄마는 화가 많이 났어요',
      ],
      answerIndex: 0,
    },
    vocabQuiz: [
      {
        word: '심부름',
        choices: ['다른 사람이 시킨 일을 대신 하는 것', '혼자 노는 것', '잠을 자는 것', '밥을 먹는 것'],
        answerIndex: 0,
      },
      {
        word: '속상하다',
        choices: ['마음이 아프고 안 좋다', '기분이 아주 좋다', '배가 고프다', '신이 난다'],
        answerIndex: 0,
      },
      {
        word: '뿌듯하다',
        choices: ['마음이 흐뭇하고 자랑스럽다', '너무 슬프다', '화가 난다', '졸리다'],
        answerIndex: 0,
      },
    ],
  },
  {
    id: 'spring-garden',
    emoji: '🌱',
    title: '봄이 온 텃밭',
    paragraphs: [
      '토리네 반 친구들은 학교 텃밭에 씨앗을 심었어요.',
      '토리는 작은 상추 씨앗을 흙 속에 콕 심었어요.',
      '친구들은 매일 물을 주며 새싹이 나오기를 기다렸어요.',
      '하루, 이틀이 지나도 아무 변화가 없어서 토리는 조금 실망했어요.',
      '선생님은 씨앗이 자라려면 시간이 필요하다고 말해주었어요.',
      '일주일이 지나자 흙 사이로 작은 초록 새싹이 쏙 올라왔어요.',
      '토리와 친구들은 새싹을 보고 손뼉을 치며 기뻐했어요.',
      '새싹은 날마다 조금씩 자라서 커다란 상추가 되었어요.',
      '토리는 기다림 끝에 얻은 상추를 보고 뿌듯함을 느꼈어요.',
    ],
    vocabulary: [
      { word: '새싹', meaning: '씨앗에서 처음 돋아난 어린 싹' },
      { word: '실망하다', meaning: '바라던 대로 되지 않아 마음이 아쉽다' },
      { word: '기다림', meaning: '어떤 일이 이루어지기를 참고 바라는 것' },
    ],
    trueFalse: [
      { statement: '친구들은 학교 텃밭에 씨앗을 심었어요.', answer: true },
      { statement: '새싹은 심자마자 바로 나왔어요.', answer: false },
      { statement: '토리는 상추 씨앗을 심었어요.', answer: true },
      { statement: '선생님은 씨앗이 필요 없다고 했어요.', answer: false },
    ],
    mainTheme: {
      question: '이 이야기의 중심 생각은 무엇일까요?',
      choices: [
        '기다리면 좋은 결과를 얻을 수 있어요',
        '씨앗은 절대 자라지 않아요',
        '텃밭은 필요 없는 곳이에요',
        '친구들은 서로 싸웠어요',
      ],
      answerIndex: 0,
    },
    vocabQuiz: [
      {
        word: '새싹',
        choices: ['씨앗에서 처음 돋아난 어린 싹', '다 자란 나무', '마른 나뭇잎', '커다란 꽃'],
        answerIndex: 0,
      },
      {
        word: '실망하다',
        choices: ['바라던 대로 되지 않아 마음이 아쉽다', '아주 기쁘다', '배가 부르다', '졸음이 온다'],
        answerIndex: 0,
      },
      {
        word: '기다림',
        choices: ['어떤 일이 이루어지기를 참고 바라는 것', '빨리 뛰어가는 것', '크게 소리치는 것', '잠을 자는 것'],
        answerIndex: 0,
      },
    ],
  },
  {
    id: 'sharing-crayons',
    emoji: '🖍️',
    title: '무지개를 함께 그려요',
    paragraphs: [
      '미소는 알록달록한 색연필을 아주 아꼈어요.',
      '짝꿍 하늘이가 색연필을 빌려달라고 했지만 미소는 싫다고 했어요.',
      '하늘이는 속상한 표정으로 자리로 돌아갔어요.',
      '미소는 혼자 그림을 그렸지만 어쩐지 재미가 없었어요.',
      '선생님은 함께 그리면 더 멋진 그림이 나온다고 말씀하셨어요.',
      '미소는 용기를 내어 하늘이에게 색연필을 나누어 주었어요.',
      '둘은 힘을 합쳐 커다란 무지개 그림을 완성했어요.',
      '미소와 하늘이는 서로 마주 보며 활짝 웃었어요.',
      '나누어 쓰니 그림도 더 예쁘고 마음도 더 따뜻해졌어요.',
    ],
    vocabulary: [
      { word: '아끼다', meaning: '소중히 여겨 함부로 하지 않다' },
      { word: '용기', meaning: '두렵지 않고 씩씩한 마음' },
      { word: '나누다', meaning: '여럿이 함께 가지거나 쓰다' },
    ],
    trueFalse: [
      { statement: '미소는 처음에 색연필을 빌려주지 않았어요.', answer: true },
      { statement: '하늘이는 색연필을 빌려서 처음부터 기뻐했어요.', answer: false },
      { statement: '미소와 하늘이는 함께 그림을 완성했어요.', answer: true },
      { statement: '둘은 끝까지 사이가 나빴어요.', answer: false },
    ],
    mainTheme: {
      question: '이 이야기가 전하고 싶은 마음은 무엇일까요?',
      choices: [
        '나누어 쓰면 마음이 따뜻해지고 즐거워져요',
        '색연필은 절대 빌려주면 안 돼요',
        '그림은 꼭 혼자 그려야 멋져요',
        '친구는 없어도 괜찮아요',
      ],
      answerIndex: 0,
    },
    vocabQuiz: [
      {
        word: '아끼다',
        choices: ['소중히 여겨 함부로 하지 않다', '아무렇게나 버리다', '크게 화를 내다', '빨리 먹어버리다'],
        answerIndex: 0,
      },
      {
        word: '용기',
        choices: ['두렵지 않고 씩씩한 마음', '아주 무서운 마음', '졸린 마음', '배고픈 마음'],
        answerIndex: 0,
      },
      {
        word: '나누다',
        choices: ['여럿이 함께 가지거나 쓰다', '혼자 다 가지다', '숨기고 감추다', '버리고 잊다'],
        answerIndex: 0,
      },
    ],
  },
]
