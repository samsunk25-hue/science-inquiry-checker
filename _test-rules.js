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

console.log(`\n${fail === 0 ? '모든 검사를 통과했습니다.' : '실패 ' + fail + '건'}\n`);
process.exit(fail === 0 ? 0 : 1);
