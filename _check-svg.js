// 삼각플라스크 친구 SVG 구조 검사 — node _check-svg.js
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

const m = html.match(/<svg class="flask"[\s\S]*?<\/svg>/);
if (!m) { console.log('SVG를 찾지 못했습니다.'); process.exit(1); }
const svg = m[0];

// 여는 태그와 닫는 태그의 짝이 맞는지
const VOID = /^(circle|rect|path|line|ellipse|polygon|polyline|use|stop)$/;
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
    if (open !== tag && !bad) bad = tag + ' 닫힘이 ' + open + '와 어긋납니다';
  } else {
    stack.push(tag);
  }
}

const faces = (svg.match(/class="(eyes-[a-z]+|m-[a-z]+)"/g) || []);
const clipOk = svg.indexOf('url(#jar)') !== -1 && svg.indexOf('id="jar"') !== -1;

console.log('태그 균형     :', bad ? '문제 — ' + bad : (stack.length ? '안 닫힌 태그 ' + stack.join(',') : '정상'));
console.log('표정 조각     :', faces.length + '개  ' + faces.map(f => f.replace(/class="|"/g, '')).join(' '));
console.log('clipPath 연결 :', clipOk ? '정상' : '끊김');

// CSS에 네 가지 상태가 모두 정의되어 있는지
['st-todo', 'st-ask', 'st-bad', 'st-ok'].forEach(function (s) {
  const n = (html.match(new RegExp('\\.flask\\.' + s, 'g')) || []).length;
  console.log('상태 ' + s.padEnd(8) + ':', n ? n + '개 규칙' : '정의 없음');
});

const fail = bad || stack.length || !clipOk;
process.exit(fail ? 1 : 0);
