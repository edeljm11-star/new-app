-- 자람토리 CRUD 기능을 위한 테이블 생성 + RLS + 기존 하드코딩 데이터 시드
-- Supabase 대시보드 > SQL Editor 에서 전체를 실행하세요.

create table if not exists situations (
  id text primary key,
  scene jsonb not null,
  question text not null,
  choices jsonb not null,
  answer_index int not null,
  explanation text not null,
  sort_order bigint not null default 0,
  -- Categorized 관찰/감정/사고/적용 questions (added after this table's
  -- original seed below); question/choices/answer_index/explanation above
  -- stay in sync with questions[0] for older code paths that still read them.
  questions jsonb,
  -- Which 친구 돕기/감정 이해·위로/... bucket (SituationGroupKey) this item
  -- shows under in the list. The original 450 seeded items are grouped by a
  -- hardcoded id->group map in grouping.ts instead (they predate this
  -- column), so this is null for them; anything created via the admin
  -- screen (manually or by AI) sets it directly.
  group_key text
);

-- Idempotent for the table above already existing in a live project from
-- before this column was added.
alter table situations add column if not exists group_key text;

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

-- Per-user quiz progress (which item was answered, and with what value —
-- a picked choice index, a score, or a plain "done" flag depending on the
-- feature). Replaces the old localStorage-only tracking so progress
-- follows the account across devices instead of being stuck on one browser.
create table if not exists user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  item_id text not null,
  value int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, item_id)
);

-- One Gemini API key per admin, used by the "AI로 만들기" content-generation
-- buttons. The key is the admin's own (free-tier) key -- entered once in
-- the admin UI, stored here, and read back into the browser to call the
-- Gemini API directly from the admin's own session.
create table if not exists admin_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gemini_api_key text,
  updated_at timestamptz not null default now()
);

alter table situations enable row level security;
alter table stories enable row level security;
alter table conversations enable row level security;
alter table crossword_puzzles enable row level security;
alter table user_progress enable row level security;
alter table admin_settings enable row level security;

drop policy if exists "public read/write" on situations;
drop policy if exists "public read/write" on stories;
drop policy if exists "public read/write" on conversations;
drop policy if exists "public read/write" on crossword_puzzles;

-- Only the Supabase Auth user with this email (created via
-- Authentication > Users) can add/edit/delete quiz content.
-- Everyone can still read.
drop policy if exists "public read" on situations;
drop policy if exists "admin write" on situations;
drop policy if exists "admin update" on situations;
drop policy if exists "admin delete" on situations;
create policy "public read" on situations for select using (true);
create policy "admin write" on situations for insert with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin update" on situations for update using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com') with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin delete" on situations for delete using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');

drop policy if exists "public read" on stories;
drop policy if exists "admin write" on stories;
drop policy if exists "admin update" on stories;
drop policy if exists "admin delete" on stories;
create policy "public read" on stories for select using (true);
create policy "admin write" on stories for insert with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin update" on stories for update using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com') with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin delete" on stories for delete using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');

drop policy if exists "public read" on conversations;
drop policy if exists "admin write" on conversations;
drop policy if exists "admin update" on conversations;
drop policy if exists "admin delete" on conversations;
create policy "public read" on conversations for select using (true);
create policy "admin write" on conversations for insert with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin update" on conversations for update using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com') with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin delete" on conversations for delete using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');

drop policy if exists "public read" on crossword_puzzles;
drop policy if exists "admin write" on crossword_puzzles;
drop policy if exists "admin update" on crossword_puzzles;
drop policy if exists "admin delete" on crossword_puzzles;
create policy "public read" on crossword_puzzles for select using (true);
create policy "admin write" on crossword_puzzles for insert with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin update" on crossword_puzzles for update using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com') with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin delete" on crossword_puzzles for delete using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');

drop policy if exists "admin read" on admin_settings;
drop policy if exists "admin write" on admin_settings;
drop policy if exists "admin update" on admin_settings;
create policy "admin read" on admin_settings for select using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin write" on admin_settings for insert with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');
create policy "admin update" on admin_settings for update using (auth.jwt() ->> 'email' = 'edeljm11@gmail.com') with check (auth.jwt() ->> 'email' = 'edeljm11@gmail.com');

-- Every signed-in user can read/write only their own progress rows —
-- unlike the content tables above, there's no admin-only write here.
drop policy if exists "own read" on user_progress;
drop policy if exists "own insert" on user_progress;
drop policy if exists "own update" on user_progress;
drop policy if exists "own delete" on user_progress;
create policy "own read" on user_progress for select using (auth.uid() = user_id);
create policy "own insert" on user_progress for insert with check (auth.uid() = user_id);
create policy "own update" on user_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on user_progress for delete using (auth.uid() = user_id);

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
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('group-project', '{"bg":"var(--color-purple-soft)","items":[{"emoji":"🧑‍🎓","top":"55%","left":"20%","size":56},{"emoji":"🧑‍🎓","top":"55%","left":"45%","size":56},{"emoji":"🎮","top":"55%","left":"75%","size":50},{"emoji":"📋","top":"25%","left":"45%","size":34}]}'::jsonb, '모둠 과제를 하는데 한 친구는 계속 게임만 하고 아무것도 하지 않아요. 나는 어떻게 해야 할까요?', '["친구에게 같이 힘을 모아서 하자고 이야기해요","친구를 무시하고 혼자 다 해버려요","화를 내며 짜증을 부려요","선생님께 가서 친구 흉을 봐요"]'::jsonb, 0, '친구에게 솔직하게 이야기하면 함께 문제를 해결할 수 있어요.', 5)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('gossip', '{"bg":"var(--color-yellow-soft)","items":[{"emoji":"🧒","top":"55%","left":"30%","size":56},{"emoji":"🤫","top":"28%","left":"30%","size":30},{"emoji":"🧒","top":"55%","left":"65%","size":56},{"emoji":"💬","top":"25%","left":"65%","size":30}]}'::jsonb, '친구가 다른 반 친구의 흉을 자꾸 나에게 이야기해요. 나는 어떻게 하는 게 좋을까요?', '["흉을 같이 보지 않고 그 친구의 좋은 점을 이야기해요","같이 맞장구치며 흉을 봐요","더 크게 소문을 퍼뜨려요","일부러 그 친구를 따돌려요"]'::jsonb, 0, '다른 사람의 흉을 보지 않고 좋은 점을 이야기하면 모두와 사이좋게 지낼 수 있어요.', 6)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('team-sports', '{"bg":"var(--color-blue-soft)","items":[{"emoji":"🏐","top":"18%","left":"50%","size":34},{"emoji":"🧒","top":"60%","left":"30%","size":56},{"emoji":"😔","top":"35%","left":"30%","size":26},{"emoji":"🧒","top":"60%","left":"70%","size":56}]}'::jsonb, '체육 시간에 피구를 했는데 우리 팀이 졌어요. 같은 팀 친구가 속상해하고 있어요. 나는 어떻게 하면 좋을까요?', '["다음에 더 잘하자고 격려해줘요","진 게 다 너 때문이라고 말해요","같이 화를 내며 짜증을 내요","말없이 자리를 떠나요"]'::jsonb, 0, '졌을 때 서로 격려하면 다음에 더 좋은 팀워크를 만들 수 있어요.', 7)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('borrow-item', '{"bg":"var(--color-pink-soft)","items":[{"emoji":"🧒","top":"55%","left":"30%","size":56},{"emoji":"😟","top":"30%","left":"30%","size":28},{"emoji":"📏","top":"70%","left":"65%","size":32},{"emoji":"🧒","top":"55%","left":"65%","size":56}]}'::jsonb, '친구에게 빌린 준비물을 깜빡하고 못 돌려줬어요. 친구가 서운해해요. 나는 어떻게 해야 할까요?', '["미안하다고 사과하고 바로 돌려줘요","별일 아니라며 그냥 넘어가요","오히려 친구에게 화를 내요","다음에 준다고 하고 계속 미뤄요"]'::jsonb, 0, '잘못을 인정하고 바로 사과하면 친구와의 믿음을 지킬 수 있어요.', 8)
on conflict (id) do nothing;
insert into situations (id, scene, question, choices, answer_index, explanation, sort_order) values ('bystander', '{"bg":"var(--color-primary-soft)","items":[{"emoji":"🧍","top":"55%","left":"20%","size":54},{"emoji":"😔","top":"30%","left":"20%","size":26},{"emoji":"🧒","top":"50%","left":"68%","size":44},{"emoji":"🧒","top":"60%","left":"80%","size":44}]}'::jsonb, '한 친구가 반 친구들에게 따돌림을 당하고 있는 것을 보았어요. 나는 어떻게 해야 할까요?', '["따돌림당하는 친구에게 다가가 함께 있어 주고 선생님께 알려요","못 본 척 지나가요","같이 따돌려요","재미있다고 웃어요"]'::jsonb, 0, '따돌림을 보고도 모른 척하지 않고 도와주는 것이 용기 있는 행동이에요.', 9)
on conflict (id) do nothing;

-- stories
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('first-errand', '🥕', '토리의 첫 심부름', '["토리는 오늘 처음으로 혼자 심부름을 가기로 했어요.","엄마는 토리에게 두부 한 모를 사 오라고 했어요.","토리는 씩씩하게 가게로 걸어갔어요.","가게에 도착했더니 두부가 다 팔리고 없었어요.","토리는 속상했지만 울지 않고 다른 가게를 찾아보기로 했어요.","옆 가게에서 드디어 두부를 찾았어요.","토리는 두부를 안전하게 들고 집으로 돌아왔어요.","엄마는 토리를 꼭 안아주며 정말 잘했다고 칭찬했어요.","토리는 스스로 해냈다는 생각에 마음이 뿌듯했어요."]'::jsonb, '[{"word":"심부름","meaning":"다른 사람이 시킨 일을 대신 하는 것"},{"word":"속상하다","meaning":"마음이 아프고 안 좋다"},{"word":"뿌듯하다","meaning":"마음이 흐뭇하고 자랑스럽다"}]'::jsonb, '[{"statement":"토리는 오늘 혼자 심부름을 갔어요.","answer":true},{"statement":"토리는 사탕을 사러 갔어요.","answer":false},{"statement":"첫 번째 가게에는 두부가 있었어요.","answer":false},{"statement":"토리는 결국 두부를 사서 집에 돌아왔어요.","answer":true}]'::jsonb, '{"question":"이 이야기가 말하고 싶은 것은 무엇일까요?","choices":["포기하지 않고 끝까지 해내면 뿌듯함을 느낄 수 있어요","심부름은 힘든 일이니 하지 않는 게 좋아요","두부는 맛이 없어요","엄마는 화가 많이 났어요"],"answerIndex":0}'::jsonb, '[{"word":"심부름","choices":["다른 사람이 시킨 일을 대신 하는 것","혼자 노는 것","잠을 자는 것","밥을 먹는 것"],"answerIndex":0},{"word":"속상하다","choices":["마음이 아프고 안 좋다","기분이 아주 좋다","배가 고프다","신이 난다"],"answerIndex":0},{"word":"뿌듯하다","choices":["마음이 흐뭇하고 자랑스럽다","너무 슬프다","화가 난다","졸리다"],"answerIndex":0}]'::jsonb, 0)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('spring-garden', '🌱', '봄이 온 텃밭', '["토리네 반 친구들은 학교 텃밭에 씨앗을 심었어요.","토리는 작은 상추 씨앗을 흙 속에 콕 심었어요.","친구들은 매일 물을 주며 새싹이 나오기를 기다렸어요.","하루, 이틀이 지나도 아무 변화가 없어서 토리는 조금 실망했어요.","선생님은 씨앗이 자라려면 시간이 필요하다고 말해주었어요.","일주일이 지나자 흙 사이로 작은 초록 새싹이 쏙 올라왔어요.","토리와 친구들은 새싹을 보고 손뼉을 치며 기뻐했어요.","새싹은 날마다 조금씩 자라서 커다란 상추가 되었어요.","토리는 기다림 끝에 얻은 상추를 보고 뿌듯함을 느꼈어요."]'::jsonb, '[{"word":"새싹","meaning":"씨앗에서 처음 돋아난 어린 싹"},{"word":"실망하다","meaning":"바라던 대로 되지 않아 마음이 아쉽다"},{"word":"기다림","meaning":"어떤 일이 이루어지기를 참고 바라는 것"}]'::jsonb, '[{"statement":"친구들은 학교 텃밭에 씨앗을 심었어요.","answer":true},{"statement":"새싹은 심자마자 바로 나왔어요.","answer":false},{"statement":"토리는 상추 씨앗을 심었어요.","answer":true},{"statement":"선생님은 씨앗이 필요 없다고 했어요.","answer":false}]'::jsonb, '{"question":"이 이야기의 중심 생각은 무엇일까요?","choices":["기다리면 좋은 결과를 얻을 수 있어요","씨앗은 절대 자라지 않아요","텃밭은 필요 없는 곳이에요","친구들은 서로 싸웠어요"],"answerIndex":0}'::jsonb, '[{"word":"새싹","choices":["씨앗에서 처음 돋아난 어린 싹","다 자란 나무","마른 나뭇잎","커다란 꽃"],"answerIndex":0},{"word":"실망하다","choices":["바라던 대로 되지 않아 마음이 아쉽다","아주 기쁘다","배가 부르다","졸음이 온다"],"answerIndex":0},{"word":"기다림","choices":["어떤 일이 이루어지기를 참고 바라는 것","빨리 뛰어가는 것","크게 소리치는 것","잠을 자는 것"],"answerIndex":0}]'::jsonb, 1)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('sharing-crayons', '🖍️', '무지개를 함께 그려요', '["미소는 알록달록한 색연필을 아주 아꼈어요.","짝꿍 하늘이가 색연필을 빌려달라고 했지만 미소는 싫다고 했어요.","하늘이는 속상한 표정으로 자리로 돌아갔어요.","미소는 혼자 그림을 그렸지만 어쩐지 재미가 없었어요.","선생님은 함께 그리면 더 멋진 그림이 나온다고 말씀하셨어요.","미소는 용기를 내어 하늘이에게 색연필을 나누어 주었어요.","둘은 힘을 합쳐 커다란 무지개 그림을 완성했어요.","미소와 하늘이는 서로 마주 보며 활짝 웃었어요.","나누어 쓰니 그림도 더 예쁘고 마음도 더 따뜻해졌어요."]'::jsonb, '[{"word":"아끼다","meaning":"소중히 여겨 함부로 하지 않다"},{"word":"용기","meaning":"두렵지 않고 씩씩한 마음"},{"word":"나누다","meaning":"여럿이 함께 가지거나 쓰다"}]'::jsonb, '[{"statement":"미소는 처음에 색연필을 빌려주지 않았어요.","answer":true},{"statement":"하늘이는 색연필을 빌려서 처음부터 기뻐했어요.","answer":false},{"statement":"미소와 하늘이는 함께 그림을 완성했어요.","answer":true},{"statement":"둘은 끝까지 사이가 나빴어요.","answer":false}]'::jsonb, '{"question":"이 이야기가 전하고 싶은 마음은 무엇일까요?","choices":["나누어 쓰면 마음이 따뜻해지고 즐거워져요","색연필은 절대 빌려주면 안 돼요","그림은 꼭 혼자 그려야 멋져요","친구는 없어도 괜찮아요"],"answerIndex":0}'::jsonb, '[{"word":"아끼다","choices":["소중히 여겨 함부로 하지 않다","아무렇게나 버리다","크게 화를 내다","빨리 먹어버리다"],"answerIndex":0},{"word":"용기","choices":["두렵지 않고 씩씩한 마음","아주 무서운 마음","졸린 마음","배고픈 마음"],"answerIndex":0},{"word":"나누다","choices":["여럿이 함께 가지거나 쓰다","혼자 다 가지다","숨기고 감추다","버리고 잊다"],"answerIndex":0}]'::jsonb, 2)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('kind-words', '💬', '말 한마디의 힘', '["민준이는 축구 경기에서 실수로 공을 놓쳐 팀이 지고 말았어요.","화가 난 친구 태호가 \"너 때문에 다 졌잖아!\"라며 날카롭게 소리쳤어요.","민준이는 속상한 마음에 아무 말도 하지 못하고 고개를 숙였어요.","다음 날 태호는 준비물을 깜빡 잊고 학교에 왔어요.","태호는 민준이에게 지우개를 빌려달라고 조심스럽게 물었어요.","민준이는 어제 들었던 말이 떠올라 \"싫어, 너도 나한테 그렇게 말했잖아\"라고 쏘아붙였어요.","둘은 하루 종일 서먹하게 지내며 마음이 불편했어요.","집에 돌아온 태호는 할머니께 오늘 있었던 일을 이야기했어요.","할머니는 \"가는 말이 고와야 오는 말이 곱다는 말이 있단다\"라고 말씀해 주셨어요.","다음 날 태호는 민준이에게 먼저 다가가 어제는 미안했다고 진심으로 사과했어요.","민준이도 활짝 웃으며 사과를 받아 주었고, 둘은 다시 예전처럼 친하게 지냈어요."]'::jsonb, '[{"word":"날카롭다","meaning":"말이나 태도가 매섭고 거칠다"},{"word":"서먹하다","meaning":"친하지 않아 어색하고 불편하다"}]'::jsonb, '[{"statement":"민준이는 축구 경기에서 실수를 했어요.","answer":true},{"statement":"태호는 민준이에게 처음부터 다정하게 말했어요.","answer":false},{"statement":"태호는 할머니께 속상한 마음을 이야기했어요.","answer":true},{"statement":"민준이와 태호는 끝까지 화해하지 않았어요.","answer":false}]'::jsonb, '{"question":"이 이야기가 전하고 싶은 것은 무엇일까요?","choices":["내가 하는 말이 고와야 상대방도 나에게 곱게 말해요","화가 나면 큰 소리로 말해야 해요","친구의 실수는 절대 용서하면 안 돼요","축구는 팀워크가 필요 없어요"],"answerIndex":0}'::jsonb, '[{"word":"날카롭다","choices":["말이나 태도가 매섭고 거칠다","아주 부드럽고 다정하다","조용하고 차분하다","즐겁고 신난다"],"answerIndex":0},{"word":"서먹하다","choices":["친하지 않아 어색하고 불편하다","아주 친하고 편안하다","기쁘고 즐겁다","화가 나서 소리치다"],"answerIndex":0},{"word":"가는 말이 고와야 오는 말이 곱다","type":"proverb","choices":["내가 좋게 말해야 남도 나에게 좋게 말한다는 뜻이에요","말은 아무렇게나 해도 된다는 뜻이에요","말을 하지 않는 것이 가장 좋다는 뜻이에요","가는 길이 예뻐야 한다는 뜻이에요"],"answerIndex":0}]'::jsonb, 3)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('coin-bank', '🐷', '저금통 속 작은 동전', '["서연이는 문구점에서 예쁜 필통을 보고 꼭 갖고 싶어졌어요.","필통 가격은 만 원이었지만, 서연이의 용돈은 겨우 천 원밖에 없었어요.","서연이는 속상해서 엄마에게 필통을 사 달라고 졸랐어요.","엄마는 \"한 번에 다 가지려고 하지 말고 조금씩 모아보는 건 어떨까?\"라고 말씀하셨어요.","서연이는 그날부터 심부름을 하고 받은 용돈을 저금통에 차곡차곡 모으기 시작했어요.","처음에는 며칠이 지나도 저금통이 무거워지지 않아 실망스러웠어요.","하지만 서연이는 포기하지 않고 한 달 동안 꾸준히 동전을 모았어요.","어느새 저금통이 묵직해졌고, 동전을 세어보니 만 원이 훌쩍 넘었어요.","엄마는 \"티끌 모아 태산이라더니, 정말 큰 돈이 되었구나!\"라며 활짝 웃으셨어요.","서연이는 스스로 모은 돈으로 필통을 사서 더욱 뿌듯하고 소중하게 느껴졌어요."]'::jsonb, '[{"word":"차곡차곡","meaning":"물건 등을 가지런히 겹치거나 쌓는 모양"},{"word":"묵직하다","meaning":"보기보다 꽤 무겁다"}]'::jsonb, '[{"statement":"서연이는 필통을 사고 싶어 했어요.","answer":true},{"statement":"서연이는 용돈을 한 번에 다 받았어요.","answer":false},{"statement":"서연이는 심부름을 해서 용돈을 받았어요.","answer":true},{"statement":"서연이는 한 달도 안 되어 포기했어요.","answer":false}]'::jsonb, '{"question":"이 이야기가 주는 교훈은 무엇일까요?","choices":["작은 돈도 꾸준히 모으면 큰돈이 될 수 있어요","용돈은 다 써버리는 것이 좋아요","원하는 것은 무조건 바로 사야 해요","저금은 힘들기만 하고 소용없어요"],"answerIndex":0}'::jsonb, '[{"word":"차곡차곡","choices":["물건을 가지런히 겹치거나 쌓는 모양","마구 흩어 놓는 모양","빠르게 뛰어가는 모양","크게 소리 지르는 모양"],"answerIndex":0},{"word":"묵직하다","choices":["보기보다 꽤 무겁다","아주 가볍다","매우 뜨겁다","몹시 차갑다"],"answerIndex":0},{"word":"티끌 모아 태산","type":"proverb","choices":["작은 것도 꾸준히 모으면 큰 것이 된다는 뜻이에요","티끌은 아무리 모아도 소용없다는 뜻이에요","산은 티끌로 이루어졌다는 뜻이에요","돈은 모으지 않는 것이 좋다는 뜻이에요"],"answerIndex":0}]'::jsonb, 4)
on conflict (id) do nothing;
insert into stories (id, emoji, title, paragraphs, vocabulary, true_false, main_theme, vocab_quiz, sort_order) values ('lift-together', '🧹', '함께 들면 가벼워요', '["오늘은 교실 대청소를 하는 날이었어요.","지훈이는 혼자서 무거운 책상을 옮기려고 낑낑댔어요.","책상은 꿈쩍도 하지 않았고, 지훈이의 이마에는 땀이 송골송골 맺혔어요.","지나가던 유나가 그 모습을 보고 \"내가 같이 들어줄게!\"라며 다가왔어요.","둘이 힘을 합치자 무겁던 책상이 거짓말처럼 스르륵 움직였어요.","곧이어 다른 친구들도 하나둘 모여들어 함께 청소를 도왔어요.","순식간에 교실 전체가 반짝반짝 깨끗해졌어요.","선생님은 흐뭇한 얼굴로 \"백지장도 맞들면 낫다는 말이 있지\"라고 말씀하셨어요.","지훈이는 혼자 끙끙대던 아까와 달리 마음이 훨씬 가볍고 즐거웠어요.","함께하니 힘든 일도 금세 끝나고, 웃음까지 더해진다는 것을 깨달았어요."]'::jsonb, '[{"word":"낑낑대다","meaning":"힘든 일을 하느라 애를 쓰며 괴로워하다"},{"word":"송골송골","meaning":"땀이나 물방울이 자잘하게 많이 맺힌 모양"}]'::jsonb, '[{"statement":"오늘은 교실 대청소를 하는 날이었어요.","answer":true},{"statement":"지훈이는 처음부터 친구들과 함께 책상을 옮겼어요.","answer":false},{"statement":"유나는 지훈이를 도와주었어요.","answer":true},{"statement":"친구들이 도와줘도 교실은 깨끗해지지 않았어요.","answer":false}]'::jsonb, '{"question":"이 이야기가 전하고 싶은 것은 무엇일까요?","choices":["힘든 일도 함께하면 쉽고 즐거워져요","청소는 혼자 해야 더 빨라요","무거운 물건은 절대 옮기면 안 돼요","친구는 도움이 필요 없어요"],"answerIndex":0}'::jsonb, '[{"word":"낑낑대다","choices":["힘든 일을 하느라 애를 쓰며 괴로워하다","신이 나서 크게 웃다","아무 걱정 없이 잠을 자다","가볍게 콧노래를 부르다"],"answerIndex":0},{"word":"송골송골","choices":["땀이나 물방울이 자잘하게 많이 맺힌 모양","눈이 펑펑 내리는 모양","바람이 세차게 부는 모양","불이 활활 타오르는 모양"],"answerIndex":0},{"word":"백지장도 맞들면 낫다","type":"proverb","choices":["쉬운 일도 함께 하면 더 수월해진다는 뜻이에요","종이는 혼자 드는 것이 좋다는 뜻이에요","무거운 것은 절대 들면 안 된다는 뜻이에요","백지장은 아무 쓸모가 없다는 뜻이에요"],"answerIndex":0}]'::jsonb, 5)
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
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('keep-secret', '친구가 비밀을 지켜달라고 부탁하고 있어요.', '[{"speaker":"A","text":"나 너한테만 말하는 건데, 진짜 비밀이야. 지켜줄 수 있어?"},{"speaker":"B","blank":true},{"speaker":"A","text":"고마워! 너라서 믿고 말하는 거야."}]'::jsonb, '[{"label":"응, 절대 다른 사람한테 말 안 할게"},{"label":"음... 다른 친구한테만 살짝 말할게"},{"label":"비밀은 재미없어"},{"label":"나도 소문낼래"}]'::jsonb, 0, 5)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('topic-compromise', '모둠 발표 주제를 정하는데 의견이 서로 달라요.', '[{"speaker":"A","text":"나는 우리 발표 주제를 동물로 하고 싶은데, 너는 어때?"},{"speaker":"B","blank":true},{"speaker":"A","text":"오, 그것도 재밌겠다! 같이 정해보자."}]'::jsonb, '[{"label":"나는 우주가 좋은데, 둘 다 조금씩 넣어서 정해보자"},{"label":"무조건 내 의견대로 해야 해"},{"label":"난 관심 없어, 네 맘대로 해"},{"label":"그 주제는 별로야"}]'::jsonb, 0, 6)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('secret-slip', '실수로 친구의 비밀을 다른 사람에게 말해버렸어요.', '[{"speaker":"B","text":"너 내 비밀 다른 애들한테 말했다며? 나 진짜 속상해."},{"speaker":"A","blank":true},{"speaker":"B","text":"...알았어, 다음부턴 조심해줘."}]'::jsonb, '[{"label":"미안해, 실수로 말이 나와버렸어. 앞으로 조심할게"},{"label":"난 말 안 했는데?"},{"label":"그게 뭐 큰일이라고"},{"label":"너도 예전에 그랬잖아"}]'::jsonb, 0, 7)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('test-score-envy', '친구가 나보다 시험을 잘 봐서 부러운 마음이 들어요.', '[{"speaker":"A","text":"이번 시험 나보다 점수 잘 나왔네... 부럽다."},{"speaker":"B","blank":true},{"speaker":"A","text":"그렇게 말해주니까 나도 기분 좋아진다!"}]'::jsonb, '[{"label":"너도 다음엔 더 잘할 수 있을 거야! 같이 공부하자"},{"label":"당연하지, 난 너보다 잘하니까"},{"label":"부러우면 너도 열심히 하지 그랬어"},{"label":"그만 얘기해"}]'::jsonb, 0, 8)
on conflict (id) do nothing;
insert into conversations (id, situation, messages, choices, answer_index, sort_order) values ('new-hobby', '친구가 새로 빠진 취미에 대해 신나게 이야기하고 있어요.', '[{"speaker":"B","text":"나 요즘 곤충 채집에 푹 빠졌어! 엄청 재밌어."},{"speaker":"A","blank":true},{"speaker":"B","text":"진짜? 다음에 같이 가자!"}]'::jsonb, '[{"label":"오 신기하다! 어떤 곤충을 제일 좋아해?"},{"label":"그런 거 왜 좋아해, 이상해"},{"label":"관심 없어"},{"label":"벌레는 더러워"}]'::jsonb, 0, 9)
on conflict (id) do nothing;

-- crossword_puzzles
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('animals-nature', '동물과 자연', '[["고","양","이",null,null],["구",null,null,"나","무"],["마","차",null,null,"지"],[null,null,null,null,"개"],[null,null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"고양이","hintText":"야옹야옹 울고 생선을 좋아하는 동물이에요","hintEmoji":"🐱"},{"number":1,"direction":"down","row":0,"col":0,"length":3,"answer":"고구마","hintText":"땅속에서 자라는 달콤하고 몸에 좋은 뿌리채소예요","hintEmoji":"🍠"},{"number":2,"direction":"across","row":1,"col":3,"length":2,"answer":"나무","hintText":"뿌리와 줄기, 잎이 있는 커다란 식물이에요","hintEmoji":"🌳"},{"number":3,"direction":"down","row":1,"col":4,"length":3,"answer":"무지개","hintText":"비 온 뒤 하늘에 뜨는 일곱 빛깔 다리예요","hintEmoji":"🌈"},{"number":4,"direction":"across","row":2,"col":0,"length":2,"answer":"마차","hintText":"말이 끌고 가는 옛날 탈것이에요","hintEmoji":"🐎"}]'::jsonb, 0)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('animals-nature-2', '동물과 자연 2', '[["강","아","지",null,"사","자"],[null,null,"렁",null,"슴","연"],[null,null,"이","슬",null,null],[null,null,null,null,null,null],["나","비",null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"강아지","hintText":"멍멍 짖고 꼬리를 흔드는 귀여운 동물이에요","hintEmoji":"🐶"},{"number":2,"direction":"down","row":0,"col":2,"length":3,"answer":"지렁이","hintText":"흙 속에 살고 다리 없이 꼬물꼬물 움직이는 동물이에요","hintEmoji":"🪱"},{"number":3,"direction":"across","row":0,"col":4,"length":2,"answer":"사자","hintText":"갈기가 멋지고 동물의 왕이라고 불려요","hintEmoji":"🦁"},{"number":3,"direction":"down","row":0,"col":4,"length":2,"answer":"사슴","hintText":"뿔이 있고 숲속을 폴짝폴짝 뛰어다녀요","hintEmoji":"🦌"},{"number":4,"direction":"down","row":0,"col":5,"length":2,"answer":"자연","hintText":"산, 바다, 나무처럼 사람이 만들지 않은 세상이에요","hintEmoji":"🌿"},{"number":5,"direction":"across","row":2,"col":2,"length":2,"answer":"이슬","hintText":"아침에 풀잎에 맺히는 작은 물방울이에요","hintEmoji":"💧"},{"number":6,"direction":"across","row":4,"col":0,"length":2,"answer":"나비","hintText":"꽃 사이를 훨훨 날아다니는 예쁜 곤충이에요","hintEmoji":"🦋"}]'::jsonb, 1)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('animals-nature-3', '동물과 자연 3', '[["코","끼","리","호","랑","이"],["스",null,null,null,null,"끼"],["모",null,null,null,null,null],["스",null,"참","새",null,null],[null,null,"외","싹",null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"코끼리","hintText":"코가 길고 큰 귀를 가진 아주 큰 동물이에요","hintEmoji":"🐘"},{"number":1,"direction":"down","row":0,"col":0,"length":4,"answer":"코스모스","hintText":"가을에 하늘하늘 피는 분홍빛 꽃이에요","hintEmoji":"🌸"},{"number":2,"direction":"across","row":0,"col":3,"length":3,"answer":"호랑이","hintText":"줄무늬가 있고 어흥 소리를 내는 용맹한 동물이에요","hintEmoji":"🐯"},{"number":3,"direction":"down","row":0,"col":5,"length":2,"answer":"이끼","hintText":"축축한 돌이나 나무에 자라는 작고 푸른 식물이에요","hintEmoji":"🌱"},{"number":4,"direction":"across","row":3,"col":2,"length":2,"answer":"참새","hintText":"짹짹 울며 마을 근처에서 흔히 보이는 작은 새예요","hintEmoji":"🐦"},{"number":4,"direction":"down","row":3,"col":2,"length":2,"answer":"참외","hintText":"노랗고 달콤한 여름 과일이에요","hintEmoji":"🍈"},{"number":5,"direction":"down","row":3,"col":3,"length":2,"answer":"새싹","hintText":"씨앗에서 처음 돋아나는 여린 잎이에요","hintEmoji":"🌿"}]'::jsonb, 2)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('animals-nature-4', '동물과 자연 4', '[["다","람","쥐","부","엉","이"],["시",null,null,"리",null,"파"],["마",null,null,null,null,"리"],["여","우",null,null,null,null],["름",null,null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"다람쥐","hintText":"볼이 볼록하고 도토리를 좋아하는 작은 동물이에요","hintEmoji":"🐿️"},{"number":1,"direction":"down","row":0,"col":0,"length":3,"answer":"다시마","hintText":"바다에서 자라는 길고 검은 해초예요","hintEmoji":"🌊"},{"number":2,"direction":"across","row":0,"col":3,"length":3,"answer":"부엉이","hintText":"눈이 크고 밤에 활동하는 새예요","hintEmoji":"🦉"},{"number":2,"direction":"down","row":0,"col":3,"length":2,"answer":"부리","hintText":"새의 입처럼 뾰족하게 나온 부분이에요","hintEmoji":"🐦"},{"number":3,"direction":"down","row":0,"col":5,"length":3,"answer":"이파리","hintText":"나뭇가지에 달린 나뭇잎을 부르는 말이에요","hintEmoji":"🍃"},{"number":4,"direction":"across","row":3,"col":0,"length":2,"answer":"여우","hintText":"꼬리가 풍성하고 꾀가 많다고 알려진 동물이에요","hintEmoji":"🦊"},{"number":4,"direction":"down","row":3,"col":0,"length":2,"answer":"여름","hintText":"덥고 매미가 우는 계절이에요","hintEmoji":"☀️"}]'::jsonb, 3)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('school-things', '학교와 물건', '[["지","우","개",null,null],["도",null,null,null,null],[null,"책","상",null,null],[null,null,"자",null,null],["우","유",null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"지우개","hintText":"연필로 쓴 글씨를 지울 때 쓰는 학용품이에요","hintEmoji":"✏️"},{"number":1,"direction":"down","row":0,"col":0,"length":2,"answer":"지도","hintText":"길이나 나라의 모습을 그려 놓은 그림이에요","hintEmoji":"🗺️"},{"number":2,"direction":"across","row":2,"col":1,"length":2,"answer":"책상","hintText":"앉아서 책을 읽거나 공부할 때 쓰는 가구예요","hintEmoji":"📚"},{"number":3,"direction":"down","row":2,"col":2,"length":2,"answer":"상자","hintText":"물건을 넣어 두는 네모난 통이에요","hintEmoji":"📦"},{"number":4,"direction":"across","row":4,"col":0,"length":2,"answer":"우유","hintText":"소에게서 짜낸 하얗고 고소한 음료예요","hintEmoji":"🥛"}]'::jsonb, 4)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('school-things-2', '학교와 물건 2', '[["가","방",null,"필","통"],["위","학",null,"기",null],[null,null,null,null,null],["시","계",null,null,null],["간",null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":2,"answer":"가방","hintText":"책이나 물건을 넣어서 어깨에 메고 다니는 물건이에요","hintEmoji":"🎒"},{"number":1,"direction":"down","row":0,"col":0,"length":2,"answer":"가위","hintText":"종이를 자를 때 쓰는 도구예요","hintEmoji":"✂️"},{"number":2,"direction":"down","row":0,"col":1,"length":2,"answer":"방학","hintText":"학교를 쉬고 집에서 노는 기간이에요","hintEmoji":"🏖️"},{"number":3,"direction":"across","row":0,"col":3,"length":2,"answer":"필통","hintText":"연필과 지우개를 넣어 두는 통이에요","hintEmoji":"✏️"},{"number":3,"direction":"down","row":0,"col":3,"length":2,"answer":"필기","hintText":"글씨를 쓰면서 배운 것을 적는 일이에요","hintEmoji":"📝"},{"number":4,"direction":"across","row":3,"col":0,"length":2,"answer":"시계","hintText":"몇 시인지 알려 주는 물건이에요","hintEmoji":"🕐"},{"number":4,"direction":"down","row":3,"col":0,"length":2,"answer":"시간","hintText":"지금이 몇 시인지를 나타내는 말이에요","hintEmoji":"⏰"}]'::jsonb, 5)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('school-things-3', '학교와 물건 3', '[["색","연","필",null,"크","레","파","스"],[null,null,"통",null,null,null,null,"케"],[null,null,null,null,null,null,null,"치"],["교","실",null,null,null,null,null,"북"],["문","내",null,null,null,null,null,null],[null,"화",null,null,null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"색연필","hintText":"여러 색깔로 그림을 그릴 수 있는 연필이에요","hintEmoji":"🖍️"},{"number":2,"direction":"down","row":0,"col":2,"length":2,"answer":"필통","hintText":"연필과 지우개를 넣어 두는 통이에요","hintEmoji":"✏️"},{"number":3,"direction":"across","row":0,"col":4,"length":4,"answer":"크레파스","hintText":"여러 색이 있고 문질러서 색칠하는 미술 도구예요","hintEmoji":"🎨"},{"number":4,"direction":"down","row":0,"col":7,"length":4,"answer":"스케치북","hintText":"그림을 그리는 두꺼운 종이가 여러 장 묶인 것이에요","hintEmoji":"📓"},{"number":5,"direction":"across","row":3,"col":0,"length":2,"answer":"교실","hintText":"친구들과 함께 공부하는 방이에요","hintEmoji":"🏫"},{"number":5,"direction":"down","row":3,"col":0,"length":2,"answer":"교문","hintText":"학교로 들어가는 큰 문이에요","hintEmoji":"🚪"},{"number":6,"direction":"down","row":3,"col":1,"length":3,"answer":"실내화","hintText":"교실 안에서 신는 신발이에요","hintEmoji":"🥿"}]'::jsonb, 6)
on conflict (id) do nothing;
insert into crossword_puzzles (id, title, grid, words, sort_order) values ('school-things-4', '학교와 물건 4', '[["책","가","방",null,"알","림","장"],["장",null,null,null,null,null,"난"],[null,null,null,null,null,null,"감"],["운","동","화",null,null,null,null],["동",null,"분",null,null,null,null],["장",null,null,null,null,null,null]]'::jsonb, '[{"number":1,"direction":"across","row":0,"col":0,"length":3,"answer":"책가방","hintText":"학교 갈 때 책과 준비물을 넣어 메고 가는 가방이에요","hintEmoji":"🎒"},{"number":1,"direction":"down","row":0,"col":0,"length":2,"answer":"책장","hintText":"책을 여러 권 꽂아 두는 가구예요","hintEmoji":"📚"},{"number":2,"direction":"across","row":0,"col":4,"length":3,"answer":"알림장","hintText":"학교에서 있었던 일이나 숙제를 적어 오는 공책이에요","hintEmoji":"📔"},{"number":3,"direction":"down","row":0,"col":6,"length":3,"answer":"장난감","hintText":"가지고 놀면 재미있는 물건이에요","hintEmoji":"🧸"},{"number":4,"direction":"across","row":3,"col":0,"length":3,"answer":"운동화","hintText":"뛰거나 운동할 때 신는 편한 신발이에요","hintEmoji":"👟"},{"number":4,"direction":"down","row":3,"col":0,"length":3,"answer":"운동장","hintText":"친구들과 뛰어놀고 운동하는 넓은 곳이에요","hintEmoji":"🏃"},{"number":5,"direction":"down","row":3,"col":2,"length":2,"answer":"화분","hintText":"흙을 담아 꽃이나 나무를 심는 그릇이에요","hintEmoji":"🪴"}]'::jsonb, 7)
on conflict (id) do nothing;
