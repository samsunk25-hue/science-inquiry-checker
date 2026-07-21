// 워드 파일(.docx) 불러오기 검사 — node _test-docx.js
// 진짜 docx를 만들어, 앱에 들어 있는 코드로 그대로 풀어 봅니다.
const fs = require('fs');
const zlib = require('zlib');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

function grab(re, name) {
  const m = html.match(re);
  if (!m) throw new Error(name + ' 정의를 찾지 못했습니다.');
  return m[0];
}

// 앱에서 쓰는 함수를 그대로 가져옵니다.
eval(grab(/function zipFind\([\s\S]*?\n  \}/, 'zipFind'));
eval(grab(/function docxToText\([\s\S]*?\n  \}/, 'docxToText'));
eval(grab(/var INTAKE_HEADS = \[[\s\S]*?\n  \];/, 'INTAKE_HEADS'));
eval(grab(/function parsePlan\([\s\S]*?\n  \}/, 'parsePlan'));

// ── 최소한의 ZIP 만들기 (deflate) ───────────────────────
function makeZip(files) {
  const locals = [], central = [];
  let offset = 0;

  files.forEach(f => {
    const name = Buffer.from(f.name, 'utf8');
    const raw = Buffer.from(f.data, 'utf8');
    const comp = f.store ? raw : zlib.deflateRawSync(raw);
    const method = f.store ? 0 : 8;
    const crc = require('zlib').crc32
      ? require('zlib').crc32(raw)
      : crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, name, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);

    offset += lh.length + name.length + comp.length;
  });

  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── 문단 형식 워드 문서 ─────────────────────────────────
const p = t => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const DOC_PARA = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body>` +
  p('탐구 주제: 물의 온도에 따라 소금이 녹는 시간이 달라질까?') +
  p('가설: 물의 온도가 높으면 소금이 녹는 시간이 짧아진다.') +
  p('조작 변인: 물의 온도') +
  p('종속 변인: 소금이 다 녹는 데 걸린 시간(초)') +
  p('통제 변인: 소금의 양, 물의 양, 젓는 빠르기') +
  p('준비물: 비커 4개, 소금 40g, 온도계, 초시계') +
  p('실험 과정') +
  p('1. 물을 200mL씩 4개의 비커에 담는다.') +
  p('2. 물의 온도를 10, 30, 50, 70℃로 맞춘다.') +
  p('3. 소금 10g을 넣고 다 녹는 시간을 3회 잰다.') +
  p('주의 사항: 뜨거운 물은 집게로 옮기고 장갑을 낀다.') +
  `</w:body></w:document>`;

// ── 표 형식 워드 문서 ───────────────────────────────────
const cell = t => `<w:tc><w:p><w:r><w:t>${t}</w:t></w:r></w:p></w:tc>`;
const row = (a, b) => `<w:tr>${cell(a)}${cell(b)}</w:tr>`;
const DOC_TABLE = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:tbl>` +
  row('탐구 주제', '경사가 급할수록 공이 멀리 갈까?') +
  row('가설', '경사가 급할수록 공이 굴러간 거리가 길어진다.') +
  row('조작 변인', '경사면의 각도') +
  row('종속 변인', '공이 굴러간 거리(cm)') +
  row('통제 변인', '공의 무게, 공의 크기, 바닥 재질') +
  `</w:tbl></w:body></w:document>`;

let fail = 0;
const check = (got, want, label) => {
  const ok = (got || '').replace(/\s+/g, ' ').trim() === want.replace(/\s+/g, ' ').trim();
  if (!ok) fail++;
  console.log(`  ${ok ? '통과' : '실패'}  ${label.padEnd(12)}` +
    (ok ? '' : `\n         받음: ${JSON.stringify(got)}\n         기대: ${JSON.stringify(want)}`));
};

function openDocx(zipBuf) {
  const ab = zipBuf.buffer.slice(zipBuf.byteOffset, zipBuf.byteOffset + zipBuf.byteLength);
  const entry = zipFind(ab, 'word/document.xml');
  if (!entry) throw new Error('word/document.xml을 찾지 못했습니다');
  const raw = entry.method === 0
    ? Buffer.from(entry.data)
    : zlib.inflateRawSync(Buffer.from(entry.data));   // 브라우저의 DecompressionStream 자리
  return parsePlan(docxToText(raw.toString('utf8')));
}

console.log('\n[ 문단 형식 워드 문서 ]');
let r = openDocx(makeZip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml', data: DOC_PARA }
]));
check(r.topic, '물의 온도에 따라 소금이 녹는 시간이 달라질까?', '주제');
check(r.hypothesis, '물의 온도가 높으면 소금이 녹는 시간이 짧아진다.', '가설');
check(r.iv, '물의 온도', '조작 변인');
check(r.dv, '소금이 다 녹는 데 걸린 시간(초)', '종속 변인');
check(r.cv, '소금의 양, 물의 양, 젓는 빠르기', '통제 변인');
check(r.materials, '비커 4개, 소금 40g, 온도계, 초시계', '준비물');
check(r.procedure,
  '1. 물을 200mL씩 4개의 비커에 담는다.\n2. 물의 온도를 10, 30, 50, 70℃로 맞춘다.\n3. 소금 10g을 넣고 다 녹는 시간을 3회 잰다.',
  '실험 과정');
check(r.safety, '뜨거운 물은 집게로 옮기고 장갑을 낀다.', '주의 사항');

console.log('\n[ 표 형식 워드 문서 ]');
r = openDocx(makeZip([
  { name: 'word/document.xml', data: DOC_TABLE }
]));
check(r.topic, '경사가 급할수록 공이 멀리 갈까?', '주제');
check(r.hypothesis, '경사가 급할수록 공이 굴러간 거리가 길어진다.', '가설');
check(r.iv, '경사면의 각도', '조작 변인');
check(r.dv, '공이 굴러간 거리(cm)', '종속 변인');
check(r.cv, '공의 무게, 공의 크기, 바닥 재질', '통제 변인');

console.log('\n[ 압축하지 않고 저장한 경우 ]');
r = openDocx(makeZip([
  { name: 'word/document.xml', data: DOC_PARA, store: true }
]));
check(r.iv, '물의 온도', '조작 변인');

console.log('\n[ 여러 파일 중에서 찾아내기 ]');
r = openDocx(makeZip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: '_rels/.rels', data: '<Relationships/>' },
  { name: 'word/styles.xml', data: '<w:styles/>' },
  { name: 'word/document.xml', data: DOC_PARA },
  { name: 'docProps/app.xml', data: '<Properties/>' }
]));
check(r.dv, '소금이 다 녹는 데 걸린 시간(초)', '종속 변인');

console.log(`\n${fail === 0 ? '모든 검사를 통과했습니다.' : '실패 ' + fail + '건'}\n`);
process.exit(fail === 0 ? 0 : 1);
