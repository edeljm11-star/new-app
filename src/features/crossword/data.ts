export type CrosswordCell = string | null

export interface CrosswordWord {
  number: number
  direction: 'across' | 'down'
  row: number
  col: number
  length: number
  answer: string
  hintText: string
  hintEmoji: string
}

export interface CrosswordPuzzle {
  id: string
  title: string
  grid: CrosswordCell[][]
  words: CrosswordWord[]
}

export const puzzles: CrosswordPuzzle[] = [
  {
    id: 'animals-nature',
    title: '동물과 자연',
    grid: [
      ['고', '양', '이', null, null],
      ['구', null, null, '나', '무'],
      ['마', '차', null, null, '지'],
      [null, null, null, null, '개'],
      [null, null, null, null, null],
    ],
    words: [
      {
        number: 1,
        direction: 'across',
        row: 0,
        col: 0,
        length: 3,
        answer: '고양이',
        hintText: '야옹야옹 울고 생선을 좋아하는 동물이에요',
        hintEmoji: '🐱',
      },
      {
        number: 1,
        direction: 'down',
        row: 0,
        col: 0,
        length: 3,
        answer: '고구마',
        hintText: '땅속에서 자라는 달콤하고 몸에 좋은 뿌리채소예요',
        hintEmoji: '🍠',
      },
      {
        number: 2,
        direction: 'across',
        row: 1,
        col: 3,
        length: 2,
        answer: '나무',
        hintText: '뿌리와 줄기, 잎이 있는 커다란 식물이에요',
        hintEmoji: '🌳',
      },
      {
        number: 3,
        direction: 'down',
        row: 1,
        col: 4,
        length: 3,
        answer: '무지개',
        hintText: '비 온 뒤 하늘에 뜨는 일곱 빛깔 다리예요',
        hintEmoji: '🌈',
      },
      {
        number: 4,
        direction: 'across',
        row: 2,
        col: 0,
        length: 2,
        answer: '마차',
        hintText: '말이 끌고 가는 옛날 탈것이에요',
        hintEmoji: '🐎',
      },
    ],
  },
  {
    id: 'school-things',
    title: '학교와 물건',
    grid: [
      ['지', '우', '개', null, null],
      ['도', null, null, null, null],
      [null, '책', '상', null, null],
      [null, null, '자', null, null],
      ['우', '유', null, null, null],
    ],
    words: [
      {
        number: 1,
        direction: 'across',
        row: 0,
        col: 0,
        length: 3,
        answer: '지우개',
        hintText: '연필로 쓴 글씨를 지울 때 쓰는 학용품이에요',
        hintEmoji: '✏️',
      },
      {
        number: 1,
        direction: 'down',
        row: 0,
        col: 0,
        length: 2,
        answer: '지도',
        hintText: '길이나 나라의 모습을 그려 놓은 그림이에요',
        hintEmoji: '🗺️',
      },
      {
        number: 2,
        direction: 'across',
        row: 2,
        col: 1,
        length: 2,
        answer: '책상',
        hintText: '앉아서 책을 읽거나 공부할 때 쓰는 가구예요',
        hintEmoji: '📚',
      },
      {
        number: 3,
        direction: 'down',
        row: 2,
        col: 2,
        length: 2,
        answer: '상자',
        hintText: '물건을 넣어 두는 네모난 통이에요',
        hintEmoji: '📦',
      },
      {
        number: 4,
        direction: 'across',
        row: 4,
        col: 0,
        length: 2,
        answer: '우유',
        hintText: '소에게서 짜낸 하얗고 고소한 음료예요',
        hintEmoji: '🥛',
      },
    ],
  },
]
