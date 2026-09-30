/**
 * Lumid psychologist survey — Google Sheets backend.
 * Deploy: Extensions → Apps Script in the responses sheet, paste this file,
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * Paste the /exec URL into SHEET_ENDPOINT in public/survey/index.html.
 */
const RESPONSES = 'Responses';
const CONTACTS = 'Contacts';
const CONTACT_HEADERS = ['submitted_at', 'response_id', 'name', 'whatsapp', 'email', 'call_slot', 'pilot'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body || !body.response || !body.response.response_id) return reply({ ok: false, error: 'missing response_id' });
    upsert(responsesSheet(), body.response, 'response_id');
    if (body.contact && body.contact.response_id) upsert(sheet(CONTACTS, CONTACT_HEADERS), body.contact, 'response_id');
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: true, service: 'lumid-survey' });
}

function responsesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(RESPONSES);
  if (!sh) {
    sh = ss.getSheets()[0];
    sh.setName(RESPONSES);
  }
  return sh;
}

function sheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Update the row with the same key, or append. Unknown fields become new columns. */
function upsert(sh, record, key) {
  const now = new Date();
  let headers = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  if (!headers.length) {
    headers = ['submitted_at', 'updated_at', key];
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  const missing = Object.keys(record).filter((k) => headers.indexOf(k) === -1);
  if (missing.length) {
    sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }

  const keyCol = headers.indexOf(key) + 1;
  const found = sh.getLastRow() > 1
    ? sh.getRange(2, keyCol, sh.getLastRow() - 1, 1).createTextFinder(String(record[key])).matchEntireCell(true).findNext()
    : null;
  const rowIndex = found ? found.getRow() : sh.getLastRow() + 1;
  const existing = found ? sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0] : [];

  const row = headers.map((h, i) => {
    if (h === 'submitted_at') return existing[i] || now;
    if (h === 'updated_at') return now;
    if (Object.prototype.hasOwnProperty.call(record, h)) return clean(record[h]);
    return existing[i] === undefined ? '' : existing[i];
  });
  sh.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

/** Stop text that starts with = + - @ from running as a formula. */
function clean(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
