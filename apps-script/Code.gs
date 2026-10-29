// 과학 탐구 계획서 — 제출 받는 구글 시트용 Apps Script
//
// 학생이 '제출'을 누르면 doPost가 '제출' 시트에 한 줄씩 쌓고,
// 앱의 교사모드는 이메일·비밀번호를 붙여 목록을 받아 갑니다.
// 설치 방법은 README의 '제출 모으기'를 보세요.

// ▼ 교사모드에 들어갈 수 있는 선생님 이메일과 비밀번호입니다. 반드시 바꾸세요.
//   여러 명이면 한 줄씩 더하면 됩니다.
const TEACHERS = {
  'teacher@example.com': '여기에-비밀번호를-적으세요'
};

const SHEET = '제출';
const HEAD = ['받은 시각', '학번', '이름', '탐구', '주제', '통과', '확인 필요', '미작성', '위험',
  '걸린 시간', '스스로 고친 횟수', '보고서', '원본'];
const CELL_MAX = 45000;   // 시트 한 칸에는 5만 자까지 들어갑니다.

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}

// 학생이 적은 글이 '=…'로 시작해도 수식으로 바뀌지 않게, 늘 글자로 넣습니다.
function text_(v, max) {
  const s = String(v == null ? '' : v).slice(0, max || 500);
  return s ? "'" + s : '';
}
function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// 이메일은 대소문자·앞뒤 빈칸을 가리지 않습니다.
function teacherOk_(email, key) {
  const want = String(email || '').trim().toLowerCase();
  return Object.keys(TEACHERS).some(function (k) {
    return k.trim().toLowerCase() === want && TEACHERS[k] === String(key || '');
  });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: '잘못된 요청입니다.' }); }
  if (d && d.action === 'list') return list_(d);
  return submit_(d);
}

function submit_(d) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!d || !String(d.id || '').trim()) return json_({ ok: false, error: '학번이 없습니다.' });
    const c = d.counts || {};
    sheet_().appendRow([
      new Date(),
      text_(d.id, 20), text_(d.name, 30), text_(d.slot, 20), text_(d.topic, 1000),
      num_(c.ok), num_(c.ask), num_(c.todo), num_(c.danger),
      text_(d.elapsed, 20), num_(d.fixCount),
      text_(d.report, CELL_MAX), text_(JSON.stringify(d.fields || {}), CELL_MAX)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function list_(d) {
  if (!teacherOk_(d.email, d.key)) {
    Utilities.sleep(800);   // 비밀번호를 마구 넣어 보는 것을 늦춥니다.
    return json_({ ok: false, error: '이메일 또는 비밀번호가 맞지 않습니다.' });
  }
  const values = sheet_().getDataRange().getValues();
  const rows = values.slice(1).map(function (r) {
    let fields = {};
    try { fields = JSON.parse(r[12] || '{}'); } catch (err) {}
    return {
      at: r[0] instanceof Date ? r[0].getTime() : String(r[0]),
      id: String(r[1]), name: String(r[2]), slot: String(r[3]), topic: String(r[4]),
      counts: { ok: r[5], ask: r[6], todo: r[7], danger: r[8] },
      elapsed: String(r[9]), fixCount: r[10],
      report: String(r[11]), fields: fields
    };
  });
  return json_({ ok: true, rows: rows });
}

// 연결 확인용 — 목록은 돌려주지 않습니다.
function doGet() {
  return json_({ ok: true });
}
