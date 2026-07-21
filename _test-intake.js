// 계획서 파일 불러오기 검사 — node _test-intake.js
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

function grab(re, name) {
  const m = html.match(re);
  if (!m) throw new Error(name + ' 정의를 찾지 못했습니다.');
  return m[0];
}
eval(grab(/var INTAKE_HEADS = \[[\s\S]*?\n  \];/, 'INTAKE_HEADS'));
eval(grab(/function parsePlan\([\s\S]*?\n  \}/, 'parsePlan'));

let fail = 0;
const check = (got, want, label) => {
  const ok = (got || '').replace(/\s+/g, ' ').trim() === want.replace(/\s+/g, ' ').trim();
  if (!ok) fail++;
  console.log(`  ${ok ? '통과' : '실패'}  ${label.padEnd(12)} ${ok ? '' : `\n         받음: ${JSON.stringify(got)}\n         기대: ${JSON.stringify(want)}`}`);
};

// ── 1. 이 앱이 내보낸 텍스트본을 되읽기 ──────────────────
console.log('\n[ 앱이 내보낸 텍스트본 되읽기 ]');
const exported = [
  '과학 탐구 계획서 · 점검 결과',
  '저장 시각 2026년 7월 21일 09:30',
  '='.repeat(52), '',
  '■ 탐구 주제 / 문제 인식',
  '   물의 양에 따라 콩나물이 자라는 정도가 달라질까?', '',
  '■ 가설',
  '   물을 많이 줄수록 줄기가 길어진다.', '',
  '■ 조작 변인 (바꾸는 것)',
  '   하루에 주는 물의 양', '',
  '■ 종속 변인 (재는 것)',
  '   줄기의 길이(cm)', '',
  '■ 통제 변인 (고정하는 것)',
  '   씨앗의 종류, 화분 크기, 흙의 양', '',
  '■ 준비물',
  '   화분 4개, 강낭콩 12개, 30cm 자', '',
  '■ 실험 과정',
  '   1. 화분에 흙을 300g씩 담는다.',
  '   2. 물을 10, 30, 50, 70mL로 다르게 준다.', '',
  '■ 예상되는 위험과 주의 사항',
  '   · 흙을 만진 뒤 손을 씻는다.', ''
].join('\n');

let r = parsePlan(exported);
check(r.topic, '물의 양에 따라 콩나물이 자라는 정도가 달라질까?', '주제');
check(r.hypothesis, '물을 많이 줄수록 줄기가 길어진다.', '가설');
check(r.iv, '하루에 주는 물의 양', '조작 변인');
check(r.dv, '줄기의 길이(cm)', '종속 변인');
check(r.cv, '씨앗의 종류, 화분 크기, 흙의 양', '통제 변인');
check(r.materials, '화분 4개, 강낭콩 12개, 30cm 자', '준비물');
check(r.procedure, '1. 화분에 흙을 300g씩 담는다.\n2. 물을 10, 30, 50, 70mL로 다르게 준다.', '실험 과정');
check(r.safety, '· 흙을 만진 뒤 손을 씻는다.', '주의 사항');

// ── 2. 학생이 손으로 쓴 형식 ───────────────────────────
console.log('\n[ 손으로 쓴 계획서 — 콜론 형식 ]');
r = parsePlan([
  '탐구 주제: 경사가 급할수록 공이 멀리 갈까?',
  '가설: 경사가 급할수록 공이 굴러간 거리가 길어진다.',
  '조작변인: 경사면의 각도',
  '종속변인: 공이 굴러간 거리(cm)',
  '통제변인: 공의 무게, 공의 크기, 바닥 재질',
  '준비물: 나무판, 각도기, 줄자, 공 1개',
  '실험 과정',
  '1. 경사면을 10도로 맞춘다.',
  '2. 공을 굴리고 거리를 잰다.',
  '안전: 공이 튀지 않게 주변을 확인한다.'
].join('\n'));
check(r.topic, '경사가 급할수록 공이 멀리 갈까?', '주제');
check(r.iv, '경사면의 각도', '조작 변인');
check(r.dv, '공이 굴러간 거리(cm)', '종속 변인');
check(r.procedure, '1. 경사면을 10도로 맞춘다.\n2. 공을 굴리고 거리를 잰다.', '실험 과정');
check(r.safety, '공이 튀지 않게 주변을 확인한다.', '주의 사항');

// ── 3. 마크다운 ────────────────────────────────────────
console.log('\n[ 마크다운 형식 ]');
r = parsePlan([
  '# 탐구 계획서',
  '## 가설',
  '소금을 많이 넣으면 어는점이 낮아진다.',
  '## 준비물',
  '- 소금 50g',
  '- 비커 3개'
].join('\n'));
check(r.hypothesis, '소금을 많이 넣으면 어는점이 낮아진다.', '가설');
check(r.materials, '- 소금 50g\n- 비커 3개', '준비물');

// ── 4. 빈칸 표시는 가져오지 않기 ────────────────────────
console.log('\n[ 빈칸 표시 걸러내기 ]');
r = parsePlan('■ 가설\n   (작성하지 않음)\n\n■ 준비물\n   비커 3개');
check(r.hypothesis === undefined ? '(없음)' : r.hypothesis, '(없음)', '빈 가설');
check(r.materials, '비커 3개', '준비물');

console.log(`\n${fail === 0 ? '모든 검사를 통과했습니다.' : '실패 ' + fail + '건'}\n`);
process.exit(fail === 0 ? 0 : 1);
