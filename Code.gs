/**
 * Lumid psychologist survey — Google Sheets backend (v3).
 *
 * Setup: open the responses sheet → Extensions → Apps Script, paste this file, save.
 * Run setup() once (Run ▸ setup) to create/format both tabs.
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * Put the /exec URL in SHEET_ENDPOINT in index.html.
 */
const TABS = {
  Responses: [
    'submitted_at', 'updated_at', 'response_id', 'status', 'last_question', 'survey_version', 'src', 'ref', 'duration_s', 'device',
    'A1_role', 'A1_other', 'A2_paying_clients', 'A3_districts', 'A4_years', 'A5_setup', 'A6_clients_per_week', 'A7_online_pct',
    'T1_digital_comfort', 'T2_digital_tools', 'T3_ai_usage', 'T3a_ai_uses', 'T4_adoption_barriers',
    'B1_tools', 'B1_other', 'B1a_software_gaps', 'B2_booking', 'B3_payment_timing', 'B4_admin_hrs_week', 'B5_notes_method', 'B6_language',
    'W1_records', 'W2_consent', 'W3_scales', 'W3a_scale_delivery', 'W4_between_sessions', 'W5_info_sharing',
    'C1_pain_rank', 'C1_none', 'C2_noshows_month', 'C3_story', 'C4_workaround', 'C4_other',
    'D1_voice_notes', 'D1_brief', 'D1_checkins', 'D1_dropoff_alert', 'D1_booking', 'D1_reminders', 'D1_progress', 'D2_one_pick', 'D3_wish',
    'E0_ai_knowledge', 'E0a_ai_helpful_for', 'E0b_ai_with_clients', 'E0c_guidelines', 'E0d_training', 'E1_ai_comfort', 'E2_blockers', 'E3_trust', 'F1_tool_spend', 'F2_pricing_model', 'F3_good_deal_inr', 'F3_too_expensive_inr',
    'G1_pilot', 'exit_email',
  ],
  Contacts: ['submitted_at', 'updated_at', 'response_id', 'name', 'whatsapp', 'email', 'pilot', 'call_slot'],
};
const KEY = 'response_id';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body || !body.response || !body.response[KEY]) return reply({ ok: false, error: 'missing response_id' });
    upsert(tab('Responses'), body.response);
    if (body.contact && body.contact[KEY]) upsert(tab('Contacts'), body.contact);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: true, service: 'lumid-survey', version: 3 });
}

/** Run once from the editor: creates both tabs with headers, frozen and styled. */
function setup() {
  Object.keys(TABS).forEach((name) => tab(name));
}

/** Get a tab by name, creating it (and its header row) if missing. */
function tab(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh && name === 'Responses' && ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0) {
    sh = ss.getSheets()[0].setName(name);
  }
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    const headers = TABS[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#242e21');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Update the row with the same response_id, or append. Unknown fields become new columns. */
function upsert(sh, record) {
  const now = new Date();
  let headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const missing = Object.keys(record).filter((k) => headers.indexOf(k) === -1);
  if (missing.length) {
    sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }

  const keyCol = headers.indexOf(KEY) + 1;
  const found = sh.getLastRow() > 1
    ? sh.getRange(2, keyCol, sh.getLastRow() - 1, 1).createTextFinder(String(record[KEY])).matchEntireCell(true).findNext()
    : null;
  const rowIndex = found ? found.getRow() : sh.getLastRow() + 1;
  const existing = found ? sh.getRange(rowIndex, 1, 1, headers.length).getValues()[0] : [];

  const row = headers.map((h, i) => {
    if (h === 'submitted_at') return existing[i] || now;
    if (h === 'updated_at') return now;
    if (Object.prototype.hasOwnProperty.call(record, h)) return clean(h, record[h]);
    return existing[i] === undefined ? '' : existing[i];
  });
  sh.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

/** Keep phone numbers as text and stop text starting with = + - @ from running as a formula. */
function clean(h, v) {
  if (v === null || v === undefined) return '';
  if (h === 'whatsapp' && v !== '') return "'" + String(v);
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
