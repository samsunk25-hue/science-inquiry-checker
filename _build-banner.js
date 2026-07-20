// 상단 배너 그림을 네 테마 블록에 한꺼번에 써 넣습니다 — node _build-banner.js
// 측정값이 올라가는 곡선 + 그것을 지켜보는 삼각플라스크.
const fs = require('fs');
const FILE = __dirname + '/index.html';

const HEART = "M20 12.8C20 0 0 0 0 12.8 0 24.8 16 32.8 20 40 24 32.8 40 24.8 40 12.8 40 0 20 0 20 12.8Z";

// 왼쪽에 삼각플라스크, 오른쪽에 측정값 곡선.
// 제목 글자는 x560 언저리에서 끝나므로 그 오른쪽만 씁니다.
const CURVE = "M905 216Q940 211 975 186Q1010 161 1036 130Q1066 96 1100 86Q1125 80 1146 70";

// c = { grid, line, area, circle, heart, heart2, liquid, edge, bubble, cheek }
function banner(c) {
  return [
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='260' preserveAspectRatio='xMaxYMid slice'>`,
    `<defs>`,
    `<pattern id='bg' width='24' height='24' patternUnits='userSpaceOnUse'>`,
    `<path d='M24 0H0v24' fill='none' stroke='${c.grid}' stroke-width='.6' stroke-opacity='${c.gridOp}'/>`,
    `</pattern>`,
    `<linearGradient id='fg' x1='0' y1='1' x2='0' y2='0'>`,
    `<stop offset='0' stop-color='${c.area}' stop-opacity='0'/>`,
    `<stop offset='1' stop-color='${c.area}' stop-opacity='${c.areaOp}'/>`,
    `</linearGradient>`,
    `</defs>`,
    `<rect width='1200' height='260' fill='url(#bg)'/>`,
    `<circle cx='822' cy='118' r='84' fill='${c.circle}' fill-opacity='${c.circleOp}'/>`,
    // 오른쪽 — 측정값 곡선
    `<path d='${CURVE}V260H905Z' fill='url(#fg)'/>`,
    `<path d='${CURVE}' fill='none' stroke='${c.line}' stroke-width='2.4' stroke-opacity='${c.lineOp}' stroke-linecap='round'/>`,
    `<g fill='${c.line}' fill-opacity='${c.dotOp}'>`,
    `<circle cx='905' cy='216' r='4'/><circle cx='975' cy='186' r='4'/><circle cx='1036' cy='130' r='4'/>`,
    `<circle cx='1100' cy='86' r='4'/><circle cx='1146' cy='70' r='4'/>`,
    `</g>`,
    // 하트
    `<g fill='${c.heart}' fill-opacity='${c.heartOp}'>`,
    `<g transform='translate(738,30) rotate(-16) scale(.4)'><path d='${HEART}'/></g>`,
    `<g transform='translate(886,198) rotate(14) scale(.36)'><path d='${HEART}'/></g>`,
    `</g>`,
    `<g fill='${c.heart2}' fill-opacity='${c.heart2Op}'>`,
    `<g transform='translate(890,34) rotate(22) scale(.32)'><path d='${HEART}'/></g>`,
    `</g>`,
    // 왼쪽 — 삼각플라스크
    `<g transform='translate(760,60) scale(2.35)'>`,
    `<path d='M14.3 36H33.7L37.5 45.5A4.5 4.5 0 0 1 33.4 52H14.6A4.5 4.5 0 0 1 10.5 45.5Z' fill='${c.liquid}'/>`,
    `<circle cx='17' cy='48' r='1.3' fill='#FFFFFF' fill-opacity='${c.bubble}'/>`,
    `<circle cx='24' cy='50' r='1' fill='#FFFFFF' fill-opacity='${c.bubble}'/>`,
    `<circle cx='31' cy='47' r='1.2' fill='#FFFFFF' fill-opacity='${c.bubble}'/>`,
    `<circle cx='15.8' cy='45.6' r='1.8' fill='#E8447F' fill-opacity='${c.cheek}'/>`,
    `<circle cx='32.2' cy='45.6' r='1.8' fill='#E8447F' fill-opacity='${c.cheek}'/>`,
    `<circle cx='19.5' cy='42' r='1.75' fill='#241920'/><circle cx='28.5' cy='42' r='1.75' fill='#241920'/>`,
    `<path d='M21 45.8q3 2.8 6 0' fill='none' stroke='#241920' stroke-width='1.9' stroke-linecap='round'/>`,
    `<path d='M16 4h16M19 4v20L10.5 45.5A4.5 4.5 0 0 0 14.6 52h18.8a4.5 4.5 0 0 0 4.1-6.5L29 24V4' fill='none' stroke='${c.edge}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/>`,
    `</g>`,
    `</svg>`
  ].join('');
}

const LIGHT = banner({
  grid: '#B32D6B', gridOp: '.12', line: '#B32D6B', lineOp: '.45', dotOp: '.5',
  area: '#E8A600', areaOp: '.22', circle: '#E8A600', circleOp: '.15',
  heart: '#F58BB4', heartOp: '.5', heart2: '#E8A600', heart2Op: '.6',
  liquid: '#F58BB4', edge: '#8A1F52', bubble: '.55', cheek: '.38'
});

const DARK = banner({
  grid: '#F58BB4', gridOp: '.15', line: '#F58BB4', lineOp: '.5', dotOp: '.55',
  area: '#FFD34E', areaOp: '.16', circle: '#FFD34E', circleOp: '.11',
  heart: '#F58BB4', heartOp: '.45', heart2: '#FFD34E', heart2Op: '.5',
  liquid: '#F58BB4', edge: '#FBB9D1', bubble: '.5', cheek: '.35'
});

const uri = svg => 'url("data:image/svg+xml,' +
  encodeURIComponent(svg).replace(/'/g, '%27').replace(/%20/g, ' ') + '")';

// 어느 테마 블록 안인지 따라가며 해당 배너로 바꿉니다.
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
let block = null, done = { light: 0, dark: 0 };

const out = lines.map(l => {
  // @media 안의 :root는 들여쓰기가 한 단계 더 깊습니다. 이걸 구분하지 않으면
  // 중첩된 :root가 블록 판정을 밝은 테마로 되돌려 버립니다.
  if (/prefers-color-scheme:\s*dark/.test(l)) block = 'dark';
  else if (/^ {2}:root\s*\{/.test(l)) block = 'light';
  else if (/:root\[data-theme="dark"\]/.test(l)) block = 'dark';
  else if (/:root\[data-theme="light"\]/.test(l)) block = 'light';

  const m = l.match(/^(\s*)--banner:/);
  if (!m) return l;
  done[block]++;
  return `${m[1]}--banner: ${uri(block === 'dark' ? DARK : LIGHT)};`;
});

fs.writeFileSync(FILE, out.join('\n'));
console.log(`배너를 다시 썼습니다 — 밝은 테마 ${done.light}곳, 어두운 테마 ${done.dark}곳`);
