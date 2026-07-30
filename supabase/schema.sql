-- 자람토리 CRUD 기능을 위한 테이블 생성 + RLS + 기존 하드코딩 데이터 시드
-- Supabase 대시보드 > SQL Editor 에서 전체를 실행하세요.

create table if not exists situations (
  id text primary key,
  scene jsonb not null,
  question text not null,
  choices jsonb not null,
  answer_index int not null,
  explanation text not null,
  sort_order bigint not null default 0
);

create table if not exists stories (
  id text primary key,
  emoji text not null,
  title text not null,
  paragraphs jsonb not null,
  vocabulary jsonb not null,
  true_false jsonb not null,
  main_theme jsonb not null,
  vocab_quiz jsonb not null,
  sort_order bigint not null default 0
);

create table if not exists conversations (
  id text primary key,
  situation text not null,
  messages jsonb not null,
  choices jsonb not null,
  answer_index int not null,
  sort_order bigint not null default 0
);

create table if not exists crossword_puzzles (
  id text primary key,
  title text not null,
  grid jsonb not null,
  words jsonb not null,
  sort_order bigint not null default 0
);

alter table situations enable row level security;
alter table stories enable row level security;
alter table conversations enable row level security;
alter table crossword_puzzles enable row level security;

drop policy if exists "public read/write" on situations;
drop policy if exists "public read/write" on stories;
drop policy if exists "public read/write" on conversations;
drop policy if exists "public read/write" on crossword_puzzles;

create policy "public read/write" on situations for all using (true) with check (true);
create policy "public read/write" on stories for all using (true) with check (true);
create policy "public read/write" on conversations for all using (true) with check (true);
create policy "public read/write" on crossword_puzzles for all using (true) with check (true);

-- situations
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('fell-down', '{"bg":"var(--color-pink-soft)","items":[{"emoji":"🤕","top":"45%","left":"35%","size":72},{"emoji":"🧍","top":"60%","left":"75%","size":60},{"emoji":"😟","top":"28%","left":"75%","size":34}]}'::jsonb, '친구가 넘어져서 아파해요. 어떻게 하면 좋을까요?', '["다가가서 괜찮은지 물어봐요","못 본 척 지나가요","친구를 보고 웃어요","더 세게 밀어요"]'::jsonb, 0, '다친 친구를 도와주면 친구가 고마워할 거예요.', 0)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('birthday', '{"bg":"var(--color-yellow-soft)","items":[{"emoji":"🥳","top":"58%","left":"32%","size":66},{"emoji":"🎂","top":"68%","left":"68%","size":58},{"emoji":"🎈","top":"18%","left":"20%","size":42},{"emoji":"🎈","top":"18%","left":"80%","size":42},{"emoji":"🎁","top":"30%","left":"52%","size":40}]}'::jsonb, '이 그림은 어떤 날일까요?', '["친구의 생일이에요","친구가 많이 아파요","학교에 가는 날이에요","잠을 자는 시간이에요"]'::jsonb, 0, '케이크와 풍선, 선물이 있으면 생일 파티예요.', 1)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('no-umbrella', '{"bg":"var(--color-blue-soft)","items":[{"emoji":"🌧️","top":"22%","left":"50%","size":58},{"emoji":"🧒","top":"68%","left":"50%","size":66},{"emoji":"💧","top":"45%","left":"22%","size":26},{"emoji":"💧","top":"45%","left":"78%","size":26}]}'::jsonb, '우산이 없어서 비를 맞게 생겼어요. 아이의 마음은 어떨까요?', '["속상하고 걱정돼요","신나고 즐거워요","아주 자랑스러워요","졸리고 심심해요"]'::jsonb, 0, '비를 맞으면 춥고 옷이 젖을 수 있어서 속상한 마음이 들어요.', 2)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('toy-fight', '{"bg":"var(--color-purple-soft)","items":[{"emoji":"🧒","top":"58%","left":"22%","size":62},{"emoji":"🧸","top":"55%","left":"50%","size":54},{"emoji":"🧒","top":"58%","left":"78%","size":62},{"emoji":"💢","top":"20%","left":"50%","size":36}]}'::jsonb, '두 친구가 장난감 하나를 두고 다투고 있어요. 가장 좋은 방법은 무엇일까요?', '["번갈아 가며 사이좋게 써요","장난감을 던져버려요","친구를 밀어요","혼자 다 가져가요"]'::jsonb, 0, '사이좋게 나누어 쓰면 둘 다 기분 좋게 놀 수 있어요.', 3)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('perfect-score', '{"bg":"var(--color-primary-soft)","items":[{"emoji":"🥳","top":"58%","left":"50%","size":72},{"emoji":"📄","top":"78%","left":"22%","size":40},{"emoji":"💯","top":"20%","left":"50%","size":46},{"emoji":"⭐","top":"32%","left":"22%","size":26},{"emoji":"⭐","top":"32%","left":"78%","size":26}]}'::jsonb, '아이가 시험에서 좋은 점수를 받고 활짝 웃고 있어요. 지금 기분은 어떨까요?', '["아주 기쁘고 뿌듯해요","슬프고 속상해요","무섭고 겁이 나요","화가 나고 짜증나요"]'::jsonb, 0, '노력한 만큼 좋은 결과가 나오면 기쁘고 뿌듯한 마음이 들어요.', 4)
on conflict (id) do nothing;

-- stories
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('first-errand', '🥕', '토리의 첫 심부름', '["토리는 오늘 처음으로 혼자 심부름을 가기로 했어요.","엄마는 토리에게 두부 한 모를 사 오라고 했어요.","토리는 씩씩하게 가게로 걸어갔어요.","가게에 도착했더니 두부가 다 팔리고 없었어요.","토리는 속상했지만 울지 않고 다른 가게를 찾아보기로 했어요.","옆 가게에서 드디어 두부를 찾았어요.","토리는 두부를 안전하게 들고 집으로 돌아왔어요.","엄마는 토리를 꼭 안아주며 정말 잘했다고 칭찬했어요.","토리는 스스로 해냈다는 생각에 마음이 뿌듯했어요."]'::jsonb, '[{"word":"심부름","meaning":"다른 사람이 시킨 일을 대신 하는 것"},{"word":"속상하다","meaning":"마음이 아프고 안 좋다"},{"word":"뿌듯하다","meaning":"마음이 흐뭇하고 자랑스럽다"}]'::jsonb, '[{"statement":"토리는 오늘 혼자 심부름을 갔어요.","answer":true},{"statement":"토리는 사탕을 사러 갔어요.","answer":false},{"statement":"첫 번째 가게에는 두부가 있었어요.","answer":false},{"statement":"토리는 결국 두부를 사서 집에 돌아왔어요.","answer":true}]'::jsonb, '{"question":"이 이야기가 말하고 싶은 것은 무엇일까요?","choices":["포기하지 않고 끝까지 해내면 뿌듯함을 느낄 수 있어요","심부름은 힘든 일이니 하지 않는 게 좋아요","두부는 맛이 없어요","엄마는 화가 많이 났어요"],"answerIndex":0}'::jsonb, '[{"word":"심부름","choices":["다른 사람이 시킨 일을 대신 하는 것","혼자 노는 것","잠을 자는 것","밥을 먹는 것"],"answerIndex":0},{"word":"속상하다","choices":["마음이 아프고 안 좋다","기분이 아주 좋다","배가 고프다","신이 난다"],"answerIndex":0},{"word":"뿌듯하다","choices":["마음이 흐뭇하고 자랑스럽다","너무 슬프다","화가 난다","졸리다"],"answerIndex":0}]'::jsonb, 0)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('spring-garden', '🌱', '봄이 온 텃밭', '["토리네 반 친구들은 학교 텃밭에 씨앗을 심었어요.","토리는 작은 상추 씨앗을 흙 속에 콕 심었어요.","친구들은 매일 물을 주며 새싹이 나오기를 기다렸어요.","하루, 이틀이 지나도 아무 변화가 없어서 토리는 조금 실망했어요.","선생님은 씨앗이 자라려면 시간이 필요하다고 말해주었어요.","일주일이 지나자 흙 사이로 작은 초록 새싹이 쏙 올라왔어요.","토리와 친구들은 새싹을 보고 손뼉을 치며 기뻐했어요.","새싹은 날마다 조금씩 자라서 커다란 상추가 되었어요.","토리는 기다림 끝에 얻은 상추를 보고 뿌듯함을 느꼈어요."]'::jsonb, '[{"word":"새싹","meaning":"씨앗에서 처음 돋아난 어린 싹"},{"word":"실망하다","meaning":"바라던 대로 되지 않아 마음이 아쉽다"},{"word":"기다림","meaning":"어떤 일이 이루어지기를 참고 바라는 것"}]'::jsonb, '[{"statement":"친구들은 학교 텃밭에 씨앗을 심었어요.","answer":true},{"statement":"새싹은 심자마자 바로 나왔어요.","answer":false},{"statement":"토리는 상추 씨앗을 심었어요.","answer":true},{"statement":"선생님은 씨앗이 필요 없다고 했어요.","answer":false}]'::jsonb, '{"question":"이 이야기의 중심 생각은 무엇일까요?","choices":["기다리면 좋은 결과를 얻을 수 있어요","씨앗은 절대 자라지 않아요","텃밭은 필요 없는 곳이에요","친구들은 서로 싸웠어요"],"answerIndex":0}'::jsonb, '[{"word":"새싹","choices":["씨앗에서 처음 돋아난 어린 싹","다 자란 나무","마른 나뭇잎","커다란 꽃"],"answerIndex":0},{"word":"실망하다","choices":["바라던 대로 되지 않아 마음이 아쉽다","아주 기쁘다","배가 부르다","졸음이 온다"],"answerIndex":0},{"word":"기다림","choices":["어떤 일이 이루어지기를 참고 바라는 것","빨리 뛰어가는 것","크게 소리치는 것","잠을 자는 것"],"answerIndex":0}]'::jsonb, 1)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('sharing-crayons', '🖍️', '무지개를 함께 그려요', '["미소는 알록달록한 색연필을 아주 아꼈어요.","짝꿍 하늘이가 색연필을 빌려달라고 했지만 미소는 싫다고 했어요.","하늘이는 속상한 표정으로 자리로 돌아갔어요.","미소는 혼자 그림을 그렸지만 어쩐지 재미가 없었어요.","선생님은 함께 그리면 더 멋진 그림이 나온다고 말씀하셨어요.","미소는 용기를 내어 하늘이에게 색연필을 나누어 주었어요.","둘은 힘을 합쳐 커다란 무지개 그림을 완성했어요.","미소와 하늘이는 서로 마주 보며 활짝 웃었어요.","나누어 쓰니 그림도 더 예쁘고 마음도 더 따뜻해졌어요."]'::jsonb, '[{"word":"아끼다","meaning":"소중히 여겨 함부로 하지 않다"},{"word":"용기","meaning":"두렵지 않고 씩씩한 마음"},{"word":"나누다","meaning":"여럿이 함께 가지거나 쓰다"}]'::jsonb, '[{"statement":"미소는 처음에 색연필을 빌려주지 않았어요.","answer":true},{"statement":"하늘이는 색연필을 빌려서 처음부터 기뻐했어요.","answer":false},{"statement":"미소와 하늘이는 함께 그림을 완성했어요.","answer":true},{"statement":"둘은 끝까지 사이가 나빴어요.","answer":false}]'::jsonb, '{"question":"이 이야기가 전하고 싶은 마음은 무엇일까요?","choices":["나누어 쓰면 마음이 따뜻해지고 즐거워져요","색연필은 절대 빌려주면 안 돼요","그림은 꼭 혼자 그려야 멋져요","친구는 없어도 괜찮아요"],"answerIndex":0}'::jsonb, '[{"word":"아끼다","choices":["소중히 여겨 함부로 하지 않다","아무렇게나 버리다","크게 화를 내다","빨리 먹어버리다"],"answerIndex":0},{"word":"용기","choices":["두렵지 않고 씩씩한 마음","아주 무서운 마음","졸린 마음","배고픈 마음"],"answerIndex":0},{"word":"나누다","choices":["여럿이 함께 가지거나 쓰다","혼자 다 가지다","숨기고 감추다","버리고 잊다"],"answerIndex":0}]'::jsonb, 2)
on conflict (id) do nothing;

-- conversations
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('reschedule', '친구와 만나는 시간을 다시 정하고 있어요.', '[{"speaker":"A","text":"우리 3시에 놀이터에서 만나기로 했지?"},{"speaker":"B","text":"응! 근데 미안한데 4시로 늦춰도 될까?"},{"speaker":"A","blank":true},{"speaker":"B","text":"고마워! 이따 봐 😊"}]'::jsonb, '[{"label":"괜찮아, 4시에 보자!"},{"label":"싫어! 꼭 3시여야 해!"},{"label":"너랑 안 놀아!"},{"label":"그냥 취소하자"}]'::jsonb, 0, 0)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('celebration', '친구가 대회에서 1등을 했다고 자랑하고 있어요.', '[{"speaker":"A","text":"나 오늘 그리기 대회에서 1등 했어!"},{"speaker":"B","blank":true},{"speaker":"A","text":"헤헤, 고마워! 너무 기뻐!"}]'::jsonb, '[{"label":"🎉","isEmoji":true},{"label":"😴","isEmoji":true},{"label":"😡","isEmoji":true},{"label":"🙄","isEmoji":true}]'::jsonb, 0, 1)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('apology', '친구의 블록을 실수로 무너뜨려서 사과하고 있어요.', '[{"speaker":"A","text":"미안해, 내가 실수로 네 블록을 넘어뜨렸어."},{"speaker":"B","blank":true},{"speaker":"A","text":"고마워, 너 정말 착하다!"}]'::jsonb, '[{"label":"괜찮아, 다시 만들면 돼!"},{"label":"저리 가!"},{"label":"다시는 너랑 안 놀아"},{"label":"너 진짜 나빠"}]'::jsonb, 0, 2)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('sharing-toy', '친구가 장난감을 같이 쓰고 싶어 해요.', '[{"speaker":"A","text":"이 장난감 나도 같이 써도 돼?"},{"speaker":"B","blank":true},{"speaker":"A","text":"좋아! 같이 놀자!"}]'::jsonb, '[{"label":"그래, 같이 쓰자!"},{"label":"안 돼, 저리 가!"},{"label":"싫어, 내 거야!"},{"label":"말하지 않고 무시하기"}]'::jsonb, 0, 3)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('empathy', '친구가 아픈 강아지 때문에 속상해하고 있어요.', '[{"speaker":"A","text":"나 오늘 강아지가 아파서 병원에 갔어... 너무 속상해."},{"speaker":"B","blank":true},{"speaker":"A","text":"그렇게 말해줘서 고마워, 마음이 좀 편해졌어."}]'::jsonb, '[{"label":"많이 속상하겠다, 강아지가 빨리 나았으면 좋겠어"},{"label":"그게 뭐 대수야?"},{"label":"나는 관심 없어"},{"label":"빨리 딴 얘기하자"}]'::jsonb, 0, 4)
on conflict (id) do nothing;

-- crossword_puzzles
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('animals-nature', '동물과 자연', '[["고","양","이",null,null],["구",null,null,"나","무"],["마","차",null,null,"지"],[null,null,null,null,"개"],[null,null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"고양이","hintText":"야옹야옹 울고 생선을 좋아하는 동물이에요","hintEmoji":"🐱"},{"number":1,"direction":"down","row":0,"col":0,"length":3,"answer":"고구마","hintText":"땅속에서 자라는 달콤하고 몸에 좋은 뿌리채소예요","hintEmoji":"🍠"},{"number":2,"direction":"across","row":1,"col":3,"length":2,"answer":"나무","hintText":"뿌리와 줄기, 잎이 있는 커다란 식물이에요","hintEmoji":"🌳"},{"number":3,"direction":"down","row":1,"col":4,"length":3,"answer":"무지개","hintText":"비 온 뒤 하늘에 뜨는 일곱 빛깔 다리예요","hintEmoji":"🌈"},{"number":4,"direction":"across","row":2,"col":0,"length":2,"answer":"마차","hintText":"말이 끌고 가는 옛날 탈것이에요","hintEmoji":"🐎"}]'::jsonb, 0)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('school-things', '학교와 물건', '[["지","우","개",null,null],["도",null,null,null,null],[null,"책","상",null,null],[null,null,"자",null,null],["우","유",null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"지우개","hintText":"연필로 쓴 글씨를 지울 때 쓰는 학용품이에요","hintEmoji":"✏️"},{"number":1,"direction":"down","row":0,"col":0,"length":2,"answer":"지도","hintText":"길이나 나라의 모습을 그려 놓은 그림이에요","hintEmoji":"🗺️"},{"number":2,"direction":"across","row":2,"col":1,"length":2,"answer":"책상","hintText":"앉아서 책을 읽거나 공부할 때 쓰는 가구예요","hintEmoji":"📚"},{"number":3,"direction":"down","row":2,"col":2,"length":2,"answer":"상자","hintText":"물건을 넣어 두는 네모난 통이에요","hintEmoji":"📦"},{"number":4,"direction":"across","row":4,"col":0,"length":2,"answer":"우유","hintText":"소에게서 짜낸 하얗고 고소한 음료예요","hintEmoji":"🥛"}]'::jsonb, 1)
on conflict (id) do nothing;
