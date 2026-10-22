// 점검 규칙 검증기 — node _test-rules.js
// 앱 파일에서 정규식 정의부를 그대로 읽어와 실제 학생 답안 예시로 시험합니다.
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

function grab(re, name) {
  const m = html.match(re);
  if (!m) throw new Error(name + ' 정의를 찾지 못했습니다.');
  return m[0];
}

// 앱에서 쓰는 정의를 그대로 가져옵니다.
eval(grab(/var DIM = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'DIM'));
eval(grab(/var VAGUE = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'VAGUE'));
eval(grab(/var NOTVAR = \/.*?\/;/, 'NOTVAR'));
eval(grab(/var UNIT = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'UNIT'));

let fail = 0;
const line = (ok, label, text, note) => {
  if (!ok) fail++;
  console.log(`  ${ok ? '통과' : '실패'}  ${label.padEnd(4)} ${text.padEnd(30)} ${note}`);
};

// ── 변인 판정 ────────────────────────────────────────────
// 앱과 동일한 판정식
const isValidVar = t =>
  !(NOTVAR.test(t) || t.length > 30) &&
  !(VAGUE.test(t) && !DIM.test(t)) &&
  (DIM.test(t) || UNIT.test(t));

console.log('\n[ 변인으로 인정해야 하는 것 ]');
[
  '물의 양', '하루에 주는 물의 양', '빛의 색깔', '경사면의 각도',
  '소금물의 농도', '용액의 온도', '줄기의 길이(cm)', '발아한 씨앗의 개수',
  '물이 끓는 데 걸린 시간', '색 변화', '길이 차이', '운동 시간',
  '체지방량', '심장 박동 수', '흙의 종류', '건강 점수'
].forEach(t => line(isValidVar(t), '인정', t, isValidVar(t) ? '' : '← 잘못 지적함'));

console.log('\n[ 변인이 아니라고 지적해야 하는 것 ]');
[
  '식물의 건강', '환경', '잘 자라는 정도', '물', '효과',
  '식물의 상태', '튼튼한 정도', '느낌', '분위기', '싱싱함'
].forEach(t => line(!isValidVar(t), '지적', t, !isValidVar(t) ? '' : '← 잘못 통과시킴'));

console.log('\n[ 변인 칸에 주제 문장을 쓴 경우 ]');
[
  ['물의 양에 따른 식물의 성장', true],
  ['온도와 반응 속도의 관계', true],
  ['운동이 체지방에 미치는 영향', true],
  ['물의 양', false],
  ['줄기의 길이(cm)', false],
  ['운동 시간', false]
].forEach(([t, want]) => {
  const got = NOTVAR.test(t);
  line(got === want, want ? '문장' : '값', t, got ? '주제 문장으로 감지' : '값으로 통과');
});

// ── 가설 판정 ────────────────────────────────────────────
const hasCond = h => /[가-힣]면[\s,]|[가-힣]면$|[가-힣]수록|[가-힣] ?때|에 따라|에 따른|보다|만약|라면|경우/.test(h);
const hasDir = h => /(증가|감소|늘어|늘고|줄어|줄고|커지|커진|커질|작아|길어|짧아|빨라|느려|높아|낮아|많아|적어|좋아|나빠|달라|변한|변할|변하|올라|오른|내려|떨어|생기|생긴|자라|자란|진다|더 )/.test(h);

console.log('\n[ 가설로 인정해야 하는 것 ]');
[
  '운동 시간이 길면 체지방량이 감소한다',
  '물을 많이 줄수록 줄기의 길이가 더 길어질 것이다',
  '온도가 높을수록 반응 속도가 빨라진다',
  '소금을 넣으면 어는점이 낮아진다',
  '빛의 색깔에 따라 광합성량이 달라질 것이다',
  '경사가 급할수록 공이 굴러가는 속도가 빨라진다',
  '설탕을 많이 넣으면 용액의 농도가 높아진다',
  '수면 시간이 짧으면 집중력 점수가 낮아질 것이다'
].forEach(h => {
  const ok = hasCond(h) && hasDir(h);
  line(ok, '인정', h.slice(0, 28), ok ? '' : `← 조건:${hasCond(h)} 방향:${hasDir(h)}`);
});

console.log('\n[ 가설이 아니라고 지적해야 하는 것 ]');
[
  ['물을 주면 식물이 자란다', 'cond-only-ok'],   // 조건 있음 → 통과해도 무방
  ['식물의 성장에 대해 알아본다', 'no'],
  ['물의 양과 식물의 관계', 'no']
].forEach(([h, kind]) => {
  const ok = hasCond(h) && hasDir(h);
  if (kind === 'no') line(!ok, '지적', h, !ok ? '' : '← 잘못 통과시킴');
  else console.log(`  참고  --   ${h.padEnd(30)} 조건 있어 통과 (허용)`);
});

// ── 변인끼리 '같은 것'인지 판정 ──────────────────────────
eval(grab(/function contentTokens\([\s\S]*?\n  \}/, 'contentTokens'));
eval(grab(/function dimsOf\([\s\S]*?\n  \}/, 'dimsOf'));
eval(grab(/function stem\(.*?\n/, 'stem'));
eval(grab(/function sameVariable\([\s\S]*?\n  \}/, 'sameVariable'));
eval(grab(/function tokenize\([\s\S]*?\n  \}/, 'tokenize'));

console.log('\n[ 서로 다른 변인으로 봐야 하는 것 ]');
[
  ['운동하는 시간  1시간/ 2시간 /3시간 /0시간', '잠자는 시간'],
  ['운동하는 시간', '먹는 양'],
  ['물의 양', '물의 온도'],
  ['물의 양', '햇빛 시간'],
  ['빛의 색깔', '빛의 세기']
].forEach(([a, b]) => {
  const same = sameVariable(a, b);
  line(!same, '별개', `${a.slice(0, 14)} vs ${b}`, same ? '← 같은 것으로 잘못 판정' : '');
});

console.log('\n[ 같은 변인으로 봐야 하는 것 ]');
[
  ['물의 양', '하루에 주는 물의 양'],
  ['운동 시간', '운동하는 시간'],
  ['용액의 온도', '용액 온도']
].forEach(([a, b]) => {
  const same = sameVariable(a, b);
  line(same, '동일', `${a} vs ${b}`, same ? '' : '← 다른 것으로 잘못 판정');
});

console.log('\n[ 변인 칸에 서술문을 쓴 경우 ]');
[
  ['체지방량(kg)이 줄어든다.', true],
  ['운동하는 시간  1시간/ 2시간 /3시간 /0시간', false],
  ['체지방량(kg)', false],
  ['줄기의 길이(cm)', false]
].forEach(([t, want]) => {
  const got = NOTVAR.test(t) || (t.length > 40 && !/\d/.test(t));
  line(got === want, want ? '문장' : '값', t.slice(0, 26), got ? '문장으로 감지' : '값으로 통과');
});

// ── 값을 여러 개로 나눈 흔적 (범주형 조작 변인 포함) ────────
eval(grab(/function hasLevels\([\s\S]*?\n  \}/, 'hasLevels'));

console.log('\n[ 값을 나눈 것으로 인정해야 하는 것 ]');
[
  '나무/유리/사포',            // 마찰력 — 범주형 바닥 재질
  '바닥 재질(나무/유리/고무)',
  '10mL / 30mL / 50mL',
  '빨강, 파랑, 초록',          // 콤마 셋 이상
  '20℃ ~ 80℃',
  '세 가지 종류의 흙',
  '경사면을 각각 다르게'
].forEach(t => line(hasLevels(t), '나눔', t.slice(0, 24), hasLevels(t) ? '' : '← 나눈 것을 못 알아봄'));

console.log('\n[ 값을 안 나눈 것 — 나눔으로 보면 안 되는 것 ]');
[
  '바닥 재질',
  '물의 양',
  '빛의 세기, 물의 양'         // 콤마 하나 = 서로 다른 두 변인
].forEach(t => line(!hasLevels(t), '단일', t.slice(0, 24), hasLevels(t) ? '← 나눈 것으로 잘못 봄' : ''));

// 조작 변인이 '둘 이상'인지 판정(콤마 셋 이상 나열은 값을 나눈 것)
const ivMulti = iv => /[가-힣]{2,}\s*[와과]\s+[가-힣]{2,}/.test(iv) || /그리고|및/.test(iv) ||
                      (/[,、]/.test(iv) && !hasLevels(iv));

console.log('\n[ 조작 변인 — 둘 이상으로 지적해야 하는 것 ]');
['빛의 세기와 물의 양', '온도 그리고 농도', '빛의 세기, 물의 양']
  .forEach(t => line(ivMulti(t), '둘', t, ivMulti(t) ? '' : '← 못 잡음'));

console.log('\n[ 조작 변인 — 하나로 봐야 하는 것 (값 나열 포함) ]');
['바닥 재질', '바닥 재질(나무/유리/사포)', '흙의 종류: 모래, 진흙, 자갈', '물의 양']
  .forEach(t => line(!ivMulti(t), '하나', t.slice(0, 24), ivMulti(t) ? '← 둘로 잘못 지적' : ''));

// ── 비속어 · 줄임말 필터 ────────────────────────────────
eval(grab(/var PROFANITY = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'PROFANITY'));
eval(grab(/var JAMO = \/.*?\/;/, 'JAMO'));
eval(grab(/var SLANG = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'SLANG'));

const flagged = t => PROFANITY.test(t) ? 'bad' : (JAMO.test(t) || SLANG.test(t)) ? 'slang' : null;

console.log('\n[ 과학 용어 — 걸리면 안 되는 것 ]');
[
  '개의 체온을 측정한다',            // 개(dog)
  '강아지 새끼의 무게를 잰다',        // 새끼(offspring)
  '원자핵의 구조를 관찰한다',         // 핵
  '세포핵을 현미경으로 본다',
  '물이 넘어가는 양을 잰다',          // 넘
  '미친 듯이 빠르게 흐른다',          // 미친 (단독)
  '개나리의 개화 시기를 비교한다'
].forEach(t => {
  const f = flagged(t);
  line(!f, '정상', t.slice(0, 24), f ? `← ${f}으로 잘못 잡음` : '');
});

console.log('\n[ 비속어 — 잡아야 하는 것 ]');
['시발 뭐야', 'ㅅㅂ 안됨', '병신같은 실험', '존나 어렵다', '개새끼', '닥쳐']
  .forEach(t => line(flagged(t) === 'bad', '비속어', t, flagged(t) === 'bad' ? '' : '← 놓침'));

console.log('\n[ 줄임말 · 채팅 말투 — 잡아야 하는 것 ]');
['ㅋㅋㅋ 재밌음', 'ㅇㅇ 맞음', '걍 대충 함', '개꿀임', 'ㄹㅇ 신기함', 'ㅠㅠ 힘들어']
  .forEach(t => line(flagged(t) === 'slang', '줄임말', t, flagged(t) === 'slang' ? '' : '← 놓침'));

// ── 값에 어울리는 서술어 ────────────────────────────────
eval(grab(/var COLLOCATION = \[[\s\S]*?\n  \}\);/, 'COLLOCATION'));
eval(grab(/function collocationIssue\([\s\S]*?\n  \}/, 'collocationIssue'));

console.log('\n[ 서술어가 안 맞아 고쳐 줘야 하는 것 ]');
[
  ['길이를 크게 한다', '늘린다'],
  ['온도를 길게 한다', '높인다'],
  ['물의 양을 높게 한다', '늘린다'],
  ['속도를 크게 한다', '빠르게'],
  ['밝기를 높게 한다', '밝게']
].forEach(([t, want]) => {
  const c = collocationIssue(t);
  const ok = c && c.ok.indexOf(want) !== -1;
  line(ok, '교정', t, ok ? `→ ${c.ok}` : '← 못 잡음');
});

console.log('\n[ 올바른 문장 — 건드리면 안 되는 것 ]');
[
  '길이가 크게 달라진다',      // 크게 = 부사, 정상
  '온도가 크게 변한다',
  '길이를 늘린다',
  '온도를 높인다',
  '크기를 크게 한다',          // 크기는 크게가 맞음
  '각도를 크게 한다'           // 각도도 크게가 자연스러움
].forEach(t => {
  const c = collocationIssue(t);
  line(!c, '정상', t, c ? '← 잘못 잡음' : '');
});

// ── 크다·많다 / 작다·적다 구분 ──────────────────────────
// 콜백 안에서 eval하면 변수가 그 스코프에 갇히므로, 한 문자열로 모아 최상위에서 실행합니다.
eval(['BIG', 'SMALL', 'MANY', 'FEW']
  .map(v => grab(new RegExp('var ' + v + ' +=.*?;'), v))
  .join('\n'));
eval(grab(/var ADJ_RULES = \[[\s\S]*?\n  \}\);/, 'ADJ_RULES'));
eval(grab(/function adjectiveIssue\([\s\S]*?\n  \}/, 'adjectiveIssue'));

console.log('\n[ 크다·많다를 바로잡아야 하는 것 ]');
[
  ['물의 양이 크다', '많다'],
  ['씨앗의 개수가 작다', '많다'],
  ['화분의 크기가 많다', '크다'],
  ['물의 온도가 크다', '높다'],
  ['줄기의 길이가 많다', '길다'],
  ['소금의 양이 클수록', '많다'],
  // 합성어 — 앞에 글자가 붙어도 잡아야 합니다
  ['운동시간을 늘리면 몸무게가 커진다', '늘어난다'],
  ['체지방량이 작아진다', '늘어난다'],
  ['강수량이 크다', '많다'],
  ['광합성량이 클수록', '많다']
].forEach(([t, want]) => {
  const a = adjectiveIssue(t);
  const ok = a && a.ok.indexOf(want) !== -1;
  line(ok, '교정', t, ok ? `→ ${a.ok}` : '← 못 잡음');
});

console.log('\n[ 올바른 표현 — 건드리면 안 되는 것 ]');
[
  '물의 양이 많다',
  '화분의 크기가 크다',
  '물의 온도가 높다',
  '줄기의 길이가 길다',
  '모양이 크다',              // '모양'의 양을 잡으면 안 됨
  '태양이 크다',              // '태양'의 양
  '영양이 많다',              // '영양'의 양
  '다양이 크다',
  '질량이 크다',              // 물리에서 올바른 표현
  '몸무게가 늘어난다',
  '물을 적게 준다',           // 부사로 쓰인 적게는 정상
  '씨앗을 많이 심는다'
].forEach(t => {
  const a = adjectiveIssue(t);
  line(!a, '정상', t, a ? `← ${a.n} 규칙에 잘못 걸림` : '');
});

// ── 측정 방법 · 단위 인정 범위 ──────────────────────────
eval(grab(/var SELF_UNIT = \/.*?\/;/, 'SELF_UNIT'));
eval(grab(/var TOOL = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'TOOL'));

console.log('\n[ 종속 변인 — 단위를 더 요구하면 안 되는 것 ]');
['시험 점수', '정답 개수', '발아율', '만족도 순위', '정답률']
  .forEach(t => {
    const ok = UNIT.test(t) || SELF_UNIT.test(t);
    line(ok, '인정', t, ok ? '' : '← 단위를 또 요구함');
  });

console.log('\n[ 측정 방법 — 도구로 인정해야 하는 것 ]');
[
  '시험을 쳐서 점수를 확인한다',
  '설문지로 답을 받는다',
  '문항 20개로 검사한다',
  '싹이 난 개수를 센다',
  '용수철저울로 힘을 잰다',
  '전류계로 전류를 측정한다',
  '리트머스 종이로 확인한다',
  '초시계로 시간을 잰다'
].forEach(t => line(TOOL.test(t), '도구', t.slice(0, 24), TOOL.test(t) ? '' : '← 못 알아봄'));

console.log('\n[ 중학교 과학 용어 — 변인으로 인정해야 하는 것 ]');
[
  '용수철이 늘어난 길이(cm)', '물체의 속력(m/s)', '전구의 밝기', '소리의 세기(dB)',
  '용액의 끓는점(℃)', '기체의 발생량(mL)', '광합성량', '증산량',
  '강수량(mm)', '풍속(m/s)', '반응 시간(초)', '집중 시간(분)'
].forEach(t => line(isValidVar(t), '인정', t, isValidVar(t) ? '' : '← 잘못 지적함'));

// ── 다른 칸에 쓴 내용 안내 ─────────────────────────────
eval(grab(/var MOVE_RULES = \[[\s\S]*?\n    \];/, 'MOVE_RULES'));

const movedTo = (text, field) => {
  for (const r of MOVE_RULES)
    if (r.from.indexOf(field) !== -1 && r.re.test(text)) return r.to;
  return null;
};

console.log('\n[ 다른 칸으로 옮기라고 알려야 하는 것 ]');
[
  ['주의사항. 운동은 과격하게 하지 않는다.', 'procedure', '안전 계획'],
  ['1. 물을 붓는다.\n2. 조심한다.', 'procedure', '안전 계획'],
  ['보안경을 착용하고 실험한다', 'materials', '안전 계획'],
  ['물을 많이 주면 키가 커질 것이다', 'topic', '가설'],
  ['준비물: 비커 3개, 물 500mL', 'procedure', '준비물']
].forEach(([t, f, want]) => {
  const got = movedTo(t, f);
  line(got === want, '이동', t.split('\n')[0].slice(0, 24), got ? `→ ${got} 칸` : '← 못 잡음');
});

console.log('\n[ 제자리에 쓴 내용 — 건드리면 안 되는 것 ]');
[
  ['1. 물을 100mL 붓는다.\n2. 3분간 젓는다.', 'procedure'],
  ['물의 양에 따라 콩나물 길이가 달라질까?', 'topic'],
  ['비커 3개, 물 500mL, 소금 20g', 'materials']
].forEach(([t, f]) => {
  const got = movedTo(t, f);
  line(!got, '정상', t.split('\n')[0].slice(0, 24), got ? `← ${got} 칸으로 잘못 안내` : '');
});

// ── 대조군 판정 ─────────────────────────────────────────
function controlVerdict(proc, iv) {
  const zeroLevel = /(^|[^\d.])0\s*(시간|분|초|일|주|mL|ml|L|g|kg|cm|mm|개|회|번|%|℃)/;
  const realControl = zeroLevel.test((iv || '') + ' ' + proc) ||
    /(아무것도|아무 ?처리|주지 ?않|하지 ?않은|넣지 ?않|그냥 ?둔|그대로 ?둔|평소대로|처리하지 ?않|물만 ?준|비교(군|용))/.test(proc);
  const wordOnly = /(대조군|대조 ?실험|비교)/.test(proc);
  return realControl ? 'ok' : wordOnly ? 'word' : 'none';
}

console.log('\n[ 실제 대조군 — 통과해야 하는 것 ]');
[
  ['물을 0mL, 10mL, 20mL 준다', ''],
  ['한 화분에는 물을 주지 않는다', ''],
  ['비료를 넣지 않은 화분과 비교한다', ''],
  ['운동을 0시간 한 사람도 측정한다', '운동 시간'],
  ['아무 처리도 하지 않은 대조군을 둔다', '']
].forEach(([p, iv]) => {
  const v = controlVerdict(p, iv);
  line(v === 'ok', '통과', p.slice(0, 24), v === 'ok' ? '' : `← ${v}`);
});

console.log('\n[ 말로만 대조군 — 지적해야 하는 것 ]');
[
  '대조군을 만든다',
  '대조군과 실험군을 비교한다',
  '비교 실험을 한다'
].forEach(p => {
  const v = controlVerdict(p, '');
  line(v === 'word', '말뿐', p, v === 'word' ? '' : (v === 'ok' ? '← 그냥 통과시킴(버그)' : `← ${v}`));
});

// ── 변인 통제가 어려운 주제 ──────────────────────────────
eval(grab(/var HARD_TOPICS = \[[\s\S]*?\n  \];/, 'HARD_TOPICS'));
const hardHit = t => HARD_TOPICS.some(r => r.re.test(t));

console.log('\n[ 통제 어려운 주제 — 안내해야 하는 것 ]');
[
  '혈액형에 따라 성격이 다를까?',
  '별자리 운세는 잘 맞을까?',
  '어떤 음악을 들으면 더 행복해질까?',
  '누가 더 예쁜 그림을 그릴까?',
  '어느 팀이 이길까?',
  '지구 온난화는 왜 일어날까?'
].forEach(t => line(hardHit(t), '안내', t, hardHit(t) ? '' : '← 못 잡음'));

console.log('\n[ 정상 주제 — 건드리면 안 되는 것 ]');
[
  '물의 온도에 따라 소금이 녹는 시간이 달라질까?',
  '운동 시간이 길면 체지방량이 줄어들까?',       // 운동은 정상
  '빛의 색깔에 따라 식물의 키가 달라질까?',
  '경사가 급할수록 공이 멀리 갈까?',
  '스트레스 호르몬 농도를 무엇이 바꿀까?'          // 스트레스 호르몬은 잴 수 있음
].forEach(t => line(!hardHit(t), '정상', t, hardHit(t) ? '← 잘못 안내' : ''));

// ── 실험 과정 줄 단위 문제 판정 ─────────────────────────
eval(grab(/function badProcedureLines\([\s\S]*?\n  \}/, 'badProcedureLines'));

console.log('\n[ 여러 줄 중 문제 줄만 골라내기 ]');
const proc = [
  '1. 화분 4개에 흙을 300g씩 담는다.',       // 0 정상
  '2. 물을 10, 30, 50, 70mL로 다르게 준다.', // 1 정상
  '주의사항: 물을 흘리지 않게 조심한다.',      // 2 안전 오배치
  '3. 3일마다 자로 길이를 잰다.',            // 3 정상
  'ㅋㅋ 대충 잰다',                        // 4 채팅
  '5. 물의 양을 크게 한다.'                 // 5 서술어 오류
].join('\n');
const bad = badProcedureLines(proc);
const badSet = Object.keys(bad).map(Number).sort((a, b) => a - b);
const want = [2, 4, 5];
line(JSON.stringify(badSet) === JSON.stringify(want), '문제줄',
  `[${badSet.join(',')}]`, JSON.stringify(badSet) === JSON.stringify(want) ? '' : `← 기대 [${want.join(',')}]`);

console.log('\n[ 정상 과정 — 빨간 줄이 없어야 하는 것 ]');
const good = [
  '1. 비커에 물을 200mL 담는다.',
  '2. 소금 10g을 넣고 젓는다.',
  '3. 녹는 시간을 초시계로 3회 잰다.'
].join('\n');
const gb = Object.keys(badProcedureLines(good)).length;
line(gb === 0, '정상', `문제 줄 ${gb}개`, gb === 0 ? '' : '← 정상 줄을 잘못 잡음');

// ── 안전 데이터 카드(MSDS 요약) ──────────────────────────
eval(grab(/var CHEM = \[[\s\S]*?\n  \}\);/, 'CHEM'));
eval(grab(/var MIX_RISK = \[[\s\S]*?\n  \];/, 'MIX_RISK'));
eval(grab(/function chemHits\([\s\S]*?\n  \}/, 'chemHits'));
eval(grab(/function mixHits\([\s\S]*?\n  \}/, 'mixHits'));
eval(grab(/function missingGear\([\s\S]*?\n  \}/, 'missingGear'));

const plan = (o) => Object.assign(
  { topic: '', hypothesis: '', iv: '', dv: '', cv: '', materials: '', procedure: '', predict: '', safety: '' }, o);

console.log('\n[ 안전 데이터 — 준비물에서 물질을 찾아야 하는 것 ]');
[
  ['묽은 염산 20mL, 비커 3개', '묽은 염산(HCl)'],
  ['수산화나트륨 알갱이 5g', '수산화나트륨(NaOH·가성소다)'],
  ['드라이아이스 100g, 페트병', '드라이아이스'],
  ['알코올램프, 삼발이, 쇠그물', '알코올램프·가스버너'],
  ['배양 접시에 곰팡이를 기른다', '미생물 배양'],
  ['수은 온도계로 잰다', '수은 온도계']
].forEach(([mat, want]) => {
  const got = chemHits(plan({ materials: mat })).map(c => c.name);
  const ok = got.indexOf(want) !== -1;
  line(ok, '감지', mat.slice(0, 24), ok ? '' : `← ${want} 못 찾음`);
});

console.log('\n[ 안전 데이터 — 엉뚱한 물질을 끌어오지 않는지 ]');
[
  // '알코올램프'는 램프 카드가 맡습니다. 소독용 에탄올 카드까지 겹쳐 뜨면 안 됩니다.
  ['알코올램프, 삼발이', '에탄올(소독용 알코올)'],
  // '초시계'의 '초'를 양초로 보면 안 됩니다.
  ['초시계로 시간을 잰다', '알코올램프·가스버너']
].forEach(([mat, notWant]) => {
  const got = chemHits(plan({ materials: mat })).map(c => c.name);
  const ok = got.indexOf(notWant) === -1;
  line(ok, '오탐', mat.slice(0, 24), ok ? '' : `← ${notWant} 카드가 잘못 떴음`);
});

console.log('\n[ 안전 데이터 — 학생이 다루면 안 되는 물질 ]');
[['메탄올 10mL', '메탄올(메틸알코올)'], ['액체질소', '액체질소'], ['수은', '수은 온도계']]
  .forEach(([mat, want]) => {
    const got = chemHits(plan({ materials: mat })).filter(c => c.ban).map(c => c.name);
    const ok = got.indexOf(want) !== -1;
    line(ok, '금지', mat, ok ? '' : '← 금지로 표시되지 않음');
  });

console.log('\n[ 섞으면 안 되는 조합 — 찾아야 하는 것 ]');
[
  ['락스와 식초를 섞는다', '염소 기체'],
  ['락스에 암모니아수를 넣는다', '클로라민 기체'],
  ['수산화나트륨 용액에 알루미늄박을 넣는다', '수소 기체'],
  ['묽은 염산에 마그네슘 리본을 넣는다', '수소 기체'],
  ['드라이아이스를 페트병에 넣고 뚜껑을 닫는다', '용기 파열']
].forEach(([proc, want]) => {
  const got = mixHits(plan({ procedure: proc })).map(m => m.what);
  const ok = got.indexOf(want) !== -1;
  line(ok, '조합', proc.slice(0, 26), ok ? '' : `← ${want} 못 찾음`);
});

console.log('\n[ 섞으면 안 되는 조합 — 한쪽만 있으면 경고하지 않아야 하는 것 ]');
['락스로 소독한다', '식초 100mL를 붓는다', '드라이아이스를 넓은 그릇에 둔다', '마그네슘 리본을 태운다']
  .forEach(t => {
    const n = mixHits(plan({ procedure: t })).length;
    line(n === 0, '정상', t, n === 0 ? '' : '← 헛경고');
  });

console.log('\n[ 보호구 — 안전 계획에 이미 적었으면 다시 요구하지 않기 ]');
{
  const p = plan({ materials: '묽은 염산 20mL' });
  const before = missingGear(p, chemHits(p)).length;
  const p2 = plan({
    materials: '묽은 염산 20mL',
    safety: chemHits(p)[0].gear.join('\n')
  });
  const after = missingGear(p2, chemHits(p2)).length;
  line(before > 0 && after === 0, '보호구', `${before}개 → ${after}개`,
    before > 0 && after === 0 ? '' : '← 보호구 대조가 어긋남');
}

console.log('\n[ 안전 데이터 표의 형식 ]');
{
  const badGear = CHEM.filter(c => c.gear.some(g => !/\.$/.test(g)));
  line(badGear.length === 0, '문장', `보호구 ${CHEM.length}개 물질`,
    badGear.length === 0 ? '' : `← 마침표 없음: ${badGear.map(c => c.name).join(', ')}`);
  const missing = CHEM.filter(c => !c.name || !c.terms.length || !c.ghs.length ||
    !c.gear.length || !c.care || !c.first || !c.waste);
  line(missing.length === 0, '빠짐', `항목 ${CHEM.length}개`,
    missing.length === 0 ? '' : `← 빠진 칸: ${missing.map(c => c.name).join(', ')}`);
}

// ── 오차 원인 미리 보기 ──────────────────────────────────
eval(grab(/var ERROR_RULES = \[[\s\S]*?\n  \];/, 'ERROR_RULES'));
eval(grab(/function errorRisks\([\s\S]*?\n  \}/, 'errorRisks'));

const risks = (o) => errorRisks(plan(o)).map(r => r.label);

console.log('\n[ 오차 — 찾아내야 하는 것 ]');
[
  [{ dv: '물의 온도(℃)', procedure: '1. 온도계로 물의 온도를 잰다.' }, '온도 재기'],
  [{ materials: '눈금실린더', procedure: '1. 물 100mL를 눈금실린더로 담는다.' }, '부피 재기'],
  [{ materials: '전자저울', procedure: '1. 저울로 소금의 무게를 잰다.' }, '무게 재기'],
  [{ materials: '초시계', procedure: '1. 초시계로 걸린 시간을 잰다.' }, '시간 재기'],
  [{ materials: '강낭콩 씨앗 12개, 화분 4개', procedure: '1. 화분에 씨앗을 심는다.' }, '식물 개체 차이'],
  [{ dv: '1분 동안의 맥박 수', procedure: '1. 운동 뒤 맥박을 센다.' }, '사람을 대상으로 한 측정'],
  [{ materials: '건전지, 전구', procedure: '1. 회로를 꾸며 전구를 켠다.' }, '전지가 닳는 것'],
  [{ procedure: '1. 소금을 넣고 저어서 녹는 시간을 잰다.' }, '젓는 정도'],
  [{ procedure: '1. 물 200mL에 소금을 넣는다.' }, '한 번만 재기']
].forEach(([o, want]) => {
  const got = risks(o);
  const ok = got.indexOf(want) !== -1;
  line(ok, '오차', want, ok ? '' : `← 못 찾음 (찾은 것: ${got.join(', ') || '없음'})`);
});

console.log('\n[ 오차 — 이미 대비했으면 말하지 않아야 하는 것 ]');
[
  [{ dv: '물의 온도(℃)', procedure: '1. 온도계를 물에 5cm 깊이로 담그고 30초 뒤에 읽는다.' }, '온도 재기'],
  [{ materials: '눈금실린더', procedure: '1. 눈금을 눈높이에서 오목한 면의 아래쪽으로 읽는다.' }, '부피 재기'],
  [{ materials: '초시계', procedure: '1. 같은 사람이 초시계로 잰다.' }, '시간 재기'],
  [{ procedure: '1. 소금을 넣고 10번 젓는다.' }, '젓는 정도'],
  [{ procedure: '1. 온도를 3회 반복해서 재어 평균을 낸다.' }, '한 번만 재기'],
  [{ cv: '화분을 같은 곳에 둔다', materials: '화분 4개',
     procedure: '1. 씨앗을 심는다. 2. 3회 반복해서 평균을 낸다.' }, '빛이 닿는 위치']
].forEach(([o, gone]) => {
  const got = risks(o);
  const ok = got.indexOf(gone) === -1;
  line(ok, '대비', gone, ok ? '' : '← 대비했는데도 또 지적함');
});

console.log('\n[ 오차 — 설계를 쓰지 않았으면 아무 말도 하지 않기 ]');
{
  const n = risks({ topic: '물의 양에 따라 식물이 자라는 정도가 달라질까?' }).length;
  line(n === 0, '침묵', `${n}개`, n === 0 ? '' : '← 설계 전에 앞서 나감');
}

// ── 실험 장치 그림 대조 ──────────────────────────────────
eval(grab(/var APPARATUS = \[[\s\S]*?\n  \}\);/, 'APPARATUS'));
eval(grab(/function apparatusInText\([\s\S]*?\n  \}/, 'apparatusInText'));

console.log('\n[ 글에서 기구를 찾아내기 ]');
[
  ['비커 3개, 온도계 1개', ['비커', '온도계']],
  ['눈금실린더로 물 100mL를 담는다', ['눈금실린더']],
  ['알코올램프와 삼발이를 놓는다', ['알코올램프', '삼발이·스탠드']],
  ['30cm 자로 줄기의 길이를 잰다', ['자·줄자']],
  ['건전지와 꼬마전구를 전선으로 잇는다', ['전지', '전구', '전선·스위치']]
].forEach(([text, want]) => {
  const got = apparatusInText({ materials: text, procedure: '' });
  const ok = want.every(w => got.indexOf(w) !== -1);
  line(ok, '기구', text.slice(0, 26), ok ? '' : `← 찾은 것: ${got.join(', ') || '없음'}`);
});

console.log('\n[ 기구 이름 규칙이 엉뚱한 것을 잡지 않는지 ]');
[
  ['자석의 세기를 잰다', '자·줄자'],       // '자석'의 '자'를 자로 보면 안 됨
  ['3초마다 기록한다', '촛불'],             // '초'를 양초로 보면 안 됨
  ['실험을 반복한다', '실·끈']              // '실험'의 '실'을 실로 보면 안 됨
].forEach(([text, notWant]) => {
  const got = apparatusInText({ materials: '', procedure: text });
  const ok = got.indexOf(notWant) === -1;
  line(ok, '오탐', text, ok ? '' : `← ${notWant}로 잘못 봄`);
});

// ── 2022 개정 교육과정 이어 붙이기 ───────────────────────
eval(grab(/var CUR_AREAS = \[[\s\S]*?\n  \];/, 'CUR_AREAS'));
eval(grab(/var DIGITAL = \/.*?\/;/, 'DIGITAL'));

// 앱과 같은 판정 — 같은 낱말이 여러 번 나온 것으로는 앞서지 않게 '가지 수'를 셉니다.
const areaOf = (text) => CUR_AREAS
  .map(a => ({
    name: a.name,
    n: new Set(text.match(new RegExp(a.re.source, 'g')) || []).size
  }))
  .filter(a => a.n > 0).sort((x, y) => y.n - x.n).map(a => a.name)[0];

console.log('\n[ 교육과정 영역 찾기 ]');
[
  ['경사가 급할수록 공이 더 멀리 굴러갈까? 빗면의 각도와 속력', '운동과 에너지'],
  ['물의 온도가 높을수록 소금이 빨리 녹을까? 용해 속도와 농도', '물질'],
  ['빛의 색깔에 따라 식물의 광합성량이 달라질까? 잎과 줄기', '생명'],
  ['모래의 굵기에 따라 퇴적되는 지층과 침식량이 달라질까? 강수량', '지구와 우주'],
  ['플라스틱 재활용과 분리 배출로 미세 플라스틱 오염을 줄일까?', '과학과 사회'],
  // 통제 변인으로 적은 '온도' 때문에 열 실험으로 끌려가서는 안 됩니다.
  ['락스의 양이 많을수록 얼룩이 빨리 지워질까? 락스, 식초, 물의 온도, 온도계', '물질'],
  // 단열·보온은 반대로 열 실험이어야 합니다.
  ['단열재를 무엇으로 하면 컵 안의 물이 가장 늦게 식을까? 뽁뽁이, 온도계', '운동과 에너지']
].forEach(([text, want]) => {
  const got = areaOf(text);
  line(got === want, '영역', want, got === want ? '' : `← ${got || '못 찾음'}`);
});

console.log('\n[ 디지털 도구를 쓴 흔적 ]');
[
  ['조도계 앱으로 밝기를 측정한다', true],
  ['영상을 촬영해 프레임으로 센다', true],
  ['자로 길이를 재어 공책에 적는다', false]
].forEach(([text, want]) => {
  const got = DIGITAL.test(text);
  line(got === want, want ? '감지' : '정상', text.slice(0, 24), got === want ? '' : '← 어긋남');
});

// ── 맥락 맞춤형 탐구 틀 ──────────────────────────────────
eval(grab(/var CONTEXT_BANK = \[[\s\S]*?\n  \];/, 'CONTEXT_BANK'));

console.log('\n[ 탐구 틀 — 학생이 채울 자리가 반드시 있어야 하는 것 ]');
{
  const seeds = CONTEXT_BANK.reduce((a, c) => a.concat(c.seeds), []);
  const noSlotQ = seeds.filter(s => !/\[[^\[\]]+\]/.test(s.q));
  line(noSlotQ.length === 0, '주제', `씨앗 ${seeds.length}개`,
    noSlotQ.length === 0 ? '' : `← 빈칸 없는 주제 ${noSlotQ.length}개`);

  const noSlotIv = seeds.filter(s => !/\[[^\[\]]+\]/.test(s.iv));
  line(noSlotIv.length === 0, '조작', `씨앗 ${seeds.length}개`,
    noSlotIv.length === 0 ? '' : `← 빈칸 없는 조작 변인 ${noSlotIv.length}개`);

  const thinCv = seeds.filter(s => s.cv.split(',').length < 3);
  line(thinCv.length === 0, '통제', '고정할 조건 3가지 이상',
    thinCv.length === 0 ? '' : `← 3가지 미만 ${thinCv.length}개`);

  const lvs = CONTEXT_BANK.filter(c => ![1, 2, 3].every(l => c.seeds.some(s => s.lv === l)));
  line(lvs.length === 0, '수준', `맥락 ${CONTEXT_BANK.length}개`,
    lvs.length === 0 ? '' : `← 수준이 빠진 맥락: ${lvs.map(c => c.label).join(', ')}`);
}

console.log('\n[ 탐구 틀 — 종속 변인이 잴 수 있는 값인가 ]');
CONTEXT_BANK.forEach(c => {
  const bad = c.seeds.filter(s => {
    const t = s.dv.replace(/\[|\]/g, '');
    return !(DIM.test(t) || UNIT.test(t) || SELF_UNIT.test(t));
  });
  line(bad.length === 0, '잴값', c.label,
    bad.length === 0 ? '' : `← 잴 수 없는 값: ${bad.map(s => s.dv).join(' / ')}`);
});

console.log(`\n${fail === 0 ? '모든 검사를 통과했습니다.' : '실패 ' + fail + '건'}\n`);
process.exit(fail === 0 ? 0 : 1);
