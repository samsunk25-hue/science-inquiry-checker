// 공유 미리보기(og:image) 검사 — node _check-og.js
// 데이터 URI를 풀어 구조를 확인하고, 눈으로 볼 수 있게 _og-preview.svg로 저장합니다.
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
// 측정값 곡선은 좌표가 자주 바뀌므로, 곡선만 쓰는 그러데이션 참조로 확인합니다.
const CURVE_MARK = "fill='url(#fg)'";
const m = html.match(/property="og:image" content="data:image\/svg\+xml,([^"]+)"/);
if (!m) { console.log('og:image를 찾지 못했습니다.'); process.exit(1); }

let svg;
try {
  svg = decodeURIComponent(m[1]);
} catch (e) {
  console.log('데이터 URI를 풀지 못했습니다 —', e.message);
  process.exit(1);
}

// 태그 짝 맞추기
const VOID = /^(rect|circle|path|line|ellipse|polygon|polyline|use|stop|image)$/;
const stack = [];
let bad = null;
const re = /<(\/?)([a-zA-Z]+)([^>]*)>/g;
let t;
while ((t = re.exec(svg)) !== null) {
  const [, close, tag, attrs] = t;
  if (attrs.trim().endsWith('/')) continue;
  if (VOID.test(tag) && !close) continue;
  if (close) {
    const open = stack.pop();
    if (open !== tag && !bad) bad = `${tag} 닫힘이 ${open}와 어긋납니다`;
  } else stack.push(tag);
}

// 참조가 끊긴 id가 없는지
const ids = (svg.match(/id='([^']+)'/g) || []).map(s => s.slice(4, -1));
const refs = (svg.match(/url\(#([^)]+)\)/g) || []).map(s => s.slice(5, -1));
const dangling = refs.filter(r => ids.indexOf(r) === -1);

// 한글이 제대로 풀렸는지
const korean = (svg.match(/[가-힣]+/g) || []);

console.log('태그 균형   :', bad ? '문제 — ' + bad : (stack.length ? '안 닫힌 태그 ' + stack.join(',') : '정상'));
console.log('id 참조     :', dangling.length ? '끊김 — ' + dangling.join(',') : `정상 (${ids.join(', ')})`);
console.log('한글 텍스트 :', korean.length ? korean.join(' / ') : '없음 — 인코딩 확인 필요');
console.log('그림 요소   :', (svg.match(/<(path|circle|rect)/g) || []).length + '개');
console.log('크기        :', (svg.match(/width='(\d+)' height='(\d+)'/) || []).slice(1).join('×'));
console.log('용량        :', Math.round(m[1].length / 1024) + 'KB (데이터 URI)');

fs.writeFileSync(__dirname + '/_og-preview.svg', svg);
console.log('\n미리보기를 _og-preview.svg로 저장했습니다.');

// ── 화면 상단 배너 ────────────────────────────────────────
// 배너도 데이터 URI라 눈으로 확인할 수 없어 함께 검사합니다.
console.log('\n[ 화면 상단 배너 ]');
const banners = html.match(/--banner: url\("data:image\/svg\+xml,([^"]+)"\)/g) || [];
let bannerFail = 0;

// 각 배너가 어느 테마 블록에 있는지 — 밝은 곳에 어두운 배너가 들어가면 안 됩니다.
const blocks = [];
let cur = null;
html.split('\n').forEach(l => {
  if (/prefers-color-scheme:\s*dark/.test(l)) cur = 'dark';
  else if (/^ {2}:root\s*\{/.test(l)) cur = 'light';
  else if (/:root\[data-theme="dark"\]/.test(l)) cur = 'dark';
  else if (/:root\[data-theme="light"\]/.test(l)) cur = 'light';
  if (/--banner:/.test(l)) blocks.push(cur);
});

if (banners.length !== 4) {
  console.log(`배너 정의가 ${banners.length}곳입니다. 밝은 테마 2곳 + 어두운 테마 2곳, 모두 4곳이어야 합니다.`);
  bannerFail++;
}

banners.forEach((b, i) => {
  const raw = b.match(/svg\+xml,([^"]+)/)[1];
  let s;
  try { s = decodeURIComponent(raw); }
  catch (e) { console.log(`  ${i + 1}번 : 데이터 URI를 풀지 못했습니다`); bannerFail++; return; }

  const bIds = (s.match(/id='([^']+)'/g) || []).map(x => x.slice(4, -1));
  const bRefs = (s.match(/url\(#([^)]+)\)/g) || []).map(x => x.slice(5, -1));
  const cut = bRefs.filter(r => bIds.indexOf(r) === -1);
  // 플라스크 캐릭터는 이제 HTML에 인라인으로 얹으므로 배너 배경에는 없는 게 정상입니다.
  const opens = (s.match(/<(?!\/)[a-z]/g) || []).length;
  const closes = (s.match(/<\//g) || []).length + (s.match(/\/>/g) || []).length;

  // 밝은 배너는 진한 분홍(#B32D6B), 어두운 배너는 연한 분홍(#F58BB4) 선을 씁니다.
  const want = blocks[i];
  const isDark = s.indexOf("stroke='#F58BB4' stroke-width='.6'") !== -1;
  const got = isDark ? 'dark' : 'light';

  const problems = [];
  if (cut.length) problems.push('끊긴 참조 ' + cut.join(','));
  if (s.indexOf(CURVE_MARK) === -1) problems.push('측정 곡선 없음');
  if (opens !== closes) problems.push(`태그 불균형 (연 ${opens} / 닫은 ${closes})`);
  if (want && got !== want) problems.push(`${want} 블록에 ${got} 배너가 들어감`);

  console.log(`  ${i + 1}번 (${want}) : ` + (problems.length ? problems.join(' · ') : '정상'));
  if (problems.length) bannerFail++;
});

process.exit(bad || stack.length || dangling.length || !korean.length || bannerFail ? 1 : 0);
