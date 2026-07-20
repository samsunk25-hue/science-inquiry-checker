// 점검 규칙 검증기 — node _test-rules.js
// 앱 파일에서 정규식 정의부를 그대로 읽어와 실제 학생 답안 예시로 시험합니다.
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/inquiry-plan-checker.html', 'utf8');

function grab(re, name) {
  const m = html.match(re);
  if (!m) throw new Error(name + ' 정의를 찾지 못했습니다.');
  return m[0];
}

// 앱에서 쓰는 정의를 그대로 가져옵니다.
eval(grab(/var DIM = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'DIM'));
eval(grab(/var VAGUE = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/, 'VAGUE'));
eval(grab(/var NOTVAR = \/.*?\/;/, 'NOTVAR'));
eval(grab(/var UNIT = \/.*?\/;/, 'UNIT'));

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

console.log(`\n${fail === 0 ? '모든 검사를 통과했습니다.' : '실패 ' + fail + '건'}\n`);
process.exit(fail === 0 ? 0 : 1);
