// 공유 미리보기(og:image) 검사 — node _check-og.js
// 데이터 URI를 풀어 구조를 확인하고, 눈으로 볼 수 있게 _og-preview.svg로 저장합니다.
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
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

process.exit(bad || stack.length || dangling.length || !korean.length ? 1 : 0);
