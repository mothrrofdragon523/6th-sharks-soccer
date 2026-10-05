// 6th Shark's Soccer: math answer log.
//
// This runs inside the progress Google Sheet (Extensions > Apps Script). The game sends each
// answered question here, and it's added as a row on the "Answers" tab. The "Progress" tab
// summarises them: skills weakest-first (all time and the last 14 days), each season and
// difficulty, and recent games.
//
// Homework problems go to their own "Homework Answers" tab instead, and the "Homework" tab
// shows how he's doing on his current worksheet: problem by problem, by skill, and on past worksheets.
//
// One-time setup: paste this in, run setup once, then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone) and put the Web app URL in the game's src/config.js.
// After changing this script: paste it in, run setup, then Deploy > Manage deployments > Edit
// (pencil) > Version: New version > Deploy, which keeps the same Web app URL.

const HEADERS = ['Time', 'Mode', 'Question set', 'Level', 'Skill', 'Question', 'His answer',
  'Correct answer', 'Right (1 = yes)', 'Game started', 'Entry ID'];
const HOMEWORK_HEADERS = ['Time', 'Worksheet', 'Problem #', 'Skill', 'Problem', 'Tries', 'His answers',
  'Correct answer', 'First try (1 = yes)', 'Got it (1 = yes)', 'Game started', 'Entry ID'];
const DATE_FORMAT = 'mmm d, yyyy h:mm am/pm';

// The game posts a list of answers (as plain text JSON).
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName('Answers') || !ss.getSheetByName('Homework Answers')) setup();
    const entries = [].concat(JSON.parse(e.postData.contents));
    const seen = CacheService.getScriptCache(); // skip any answer sent twice
    const rows = [], homework = [];
    for (const r of entries) {
      if (!r || !r.id || seen.get(r.id)) continue;
      seen.put(r.id, '1', 21600);
      if (r.kind === 'homework') {
        homework.push([
          new Date(r.time), r.worksheet || '', r.n || '', r.skill || '', r.question || '', r.tries || 1,
          r.answers || '', r.correctAnswer || '', r.firstTry ? 1 : 0, r.solved ? 1 : 0,
          r.gameId ? new Date(r.gameId) : '', r.id,
        ]);
        continue;
      }
      rows.push([
        new Date(r.time), r.mode || '', r.set || '', r.level || '', r.skill || '', r.question || '',
        r.answer || '', r.correctAnswer || '', r.right ? 1 : 0, r.gameId ? new Date(r.gameId) : '', r.id,
      ]);
    }
    append(ss.getSheetByName('Answers'), rows);
    append(ss.getSheetByName('Homework Answers'), homework);
    return ContentService.createTextOutput('ok ' + (rows.length + homework.length));
  } finally {
    lock.releaseLock();
  }
}

function append(sheet, rows) {
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

// Builds the Answers, Progress, Homework Answers and Homework tabs. Safe to run again: it keeps
// the answers and rebuilds Progress and Homework.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let answers = ss.getSheetByName('Answers');
  if (!answers) {
    answers = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0
      ? ss.getSheets()[0].setName('Answers')
      : ss.insertSheet('Answers');
  }
  answers.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#004c54').setFontColor('#ffffff');
  answers.setFrozenRows(1);
  answers.getRange('A2:A').setNumberFormat(DATE_FORMAT);
  answers.getRange('J2:J').setNumberFormat(DATE_FORMAT);
  answers.setColumnWidth(6, 420);
  answers.setColumnWidths(7, 2, 180);
  const right = answers.getRange('I2:I');
  answers.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(1).setBackground('#d9ead3').setRanges([right]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(0).setBackground('#f4cccc').setRanges([right]).build(),
  ]);

  const progress = ss.getSheetByName('Progress') || ss.insertSheet('Progress', 0);
  progress.clear();
  progress.clearConditionalFormatRules();
  progress.getRange('A1').setValue("6th Shark's Soccer: Math Progress").setFontSize(16).setFontWeight('bold');
  progress.getRange('A2').setValue('Weakest skills are at the top of each skills table. Updates automatically as he plays.')
    .setFontColor('#666666');

  const pct = "format avg(I) '0%'";
  const tables = [
    ['A3', 'Skills: all time',
      "=IFERROR(QUERY(Answers!A2:K, \"select E, count(I), sum(I), avg(I) where E is not null group by E " +
      "order by avg(I) asc, count(I) desc label E 'Skill', count(I) 'Answered', sum(I) 'Right', avg(I) '% right' " + pct + "\", 0), \"No answers yet\")"],
    ['F3', 'Skills: last 14 days',
      "=IFERROR(QUERY(Answers!A2:K, \"select E, count(I), sum(I), avg(I) where E is not null and A >= datetime '\"&TEXT(NOW()-14, \"yyyy-mm-dd HH:mm:ss\")&\"' " +
      "group by E order by avg(I) asc, count(I) desc label E 'Skill', count(I) 'Answered', sum(I) 'Right', avg(I) '% right' " + pct + "\", 0), \"Nothing in the last 14 days\")"],
    ['K3', 'By season and difficulty',
      "=IFERROR(QUERY(Answers!A2:K, \"select C, D, count(I), avg(I) where C is not null group by C, D order by C, D " +
      "label C 'Questions from', D 'Level', count(I) 'Answered', avg(I) '% right' " + pct + "\", 0), \"No answers yet\")"],
    ['P3', 'Recent games',
      "=IFERROR(QUERY(Answers!A2:K, \"select J, B, count(I), sum(I), avg(I) where J is not null group by J, B order by J desc limit 20 " +
      "label J 'Game started', B 'Mode', count(I) 'Questions', sum(I) 'Right', avg(I) '% right' format J 'mmm d, h:mm am/pm', avg(I) '0%'\", 0), \"No games yet\")"],
  ];
  for (const [cell, title, formula] of tables) {
    const top = progress.getRange(cell);
    top.setValue(title).setFontWeight('bold').setFontSize(12).setFontColor('#004c54');
    top.offset(1, 0).setFormula(formula);
  }
  progress.getRange('A4:T4').setFontWeight('bold');
  progress.setColumnWidth(1, 230);
  progress.setColumnWidth(6, 230);
  progress.setColumnWidth(11, 140);
  progress.setColumnWidth(16, 160);
  progress.setColumnWidth(17, 170);
  for (const col of [5, 10, 15]) progress.setColumnWidth(col, 24);

  // Red (weak) to green (strong) on the % right columns
  const pctRanges = ['D5:D40', 'I5:I40', 'N5:N40', 'T5:T40'].map(a1 => progress.getRange(a1));
  progress.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .setGradientMinpointWithValue('#e67c73', SpreadsheetApp.InterpolationType.NUMBER, '0.4')
      .setGradientMidpointWithValue('#ffd666', SpreadsheetApp.InterpolationType.NUMBER, '0.7')
      .setGradientMaxpointWithValue('#57bb8a', SpreadsheetApp.InterpolationType.NUMBER, '1')
      .setRanges(pctRanges)
      .build(),
  ]);

  setupHomework(ss);
  return answers;
}

// Homework Answers holds one row per homework problem asked. The Homework tab follows his current
// worksheet (the one he played most recently), so it always shows what he's learning right now.
function setupHomework(ss) {
  const answers = ss.getSheetByName('Homework Answers') || ss.insertSheet('Homework Answers');
  answers.getRange(1, 1, 1, HOMEWORK_HEADERS.length).setValues([HOMEWORK_HEADERS])
    .setFontWeight('bold').setBackground('#26a69a').setFontColor('#ffffff');
  answers.setFrozenRows(1);
  answers.getRange('A2:A').setNumberFormat(DATE_FORMAT);
  answers.getRange('K2:K').setNumberFormat(DATE_FORMAT);
  answers.setColumnWidth(2, 180);
  answers.setColumnWidth(5, 420);
  answers.setColumnWidths(7, 2, 160);
  const marks = answers.getRange('I2:J');
  answers.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(1).setBackground('#d9ead3').setRanges([marks]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(0).setBackground('#f4cccc').setRanges([marks]).build(),
  ]);

  const hw = ss.getSheetByName('Homework') || ss.insertSheet('Homework', 1);
  hw.clear();
  hw.clearConditionalFormatRules();
  hw.getRange('A1').setValue("6th Shark's Soccer: Homework").setFontSize(16).setFontWeight('bold');
  hw.getRange('A2').setValue('Current worksheet:').setFontWeight('bold');
  hw.getRange('B2').setFormula("=IFERROR(INDEX(FILTER('Homework Answers'!B2:B, 'Homework Answers'!B2:B<>\"\"), COUNTA('Homework Answers'!B2:B)), \"None yet\")")
    .setFontWeight('bold').setFontColor('#00695c');
  hw.getRange('A3').setValue('Hardest problems and skills are at the top. Updates automatically as he plays.')
    .setFontColor('#666666');

  const current = "where B = '\"&$B$2&\"'";
  const tables = [
    ['A5', 'This worksheet: problem by problem',
      "=IFERROR(QUERY('Homework Answers'!A2:L, \"select C, E, count(I), sum(I), sum(J), avg(F) " + current + " group by C, E " +
      "order by avg(F) desc, C label C '#', E 'Problem', count(I) 'Asked', sum(I) 'First try', sum(J) 'Got it', avg(F) 'Avg tries' " +
      "format avg(F) '0.0'\", 0), \"No answers yet\")"],
    ['H5', 'This worksheet: by skill',
      "=IFERROR(QUERY('Homework Answers'!A2:L, \"select D, count(I), avg(I), avg(J) " + current + " group by D " +
      "order by avg(I) asc label D 'Skill', count(I) 'Asked', avg(I) 'First try %', avg(J) 'Got it %' " +
      "format avg(I) '0%', avg(J) '0%'\", 0), \"No answers yet\")"],
    ['M5', 'All worksheets',
      "=IFERROR(QUERY('Homework Answers'!A2:L, \"select B, max(A), count(I), avg(I), avg(J) where B is not null group by B " +
      "order by max(A) desc label B 'Worksheet', max(A) 'Last played', count(I) 'Asked', avg(I) 'First try %', avg(J) 'Got it %' " +
      "format max(A) 'mmm d', avg(I) '0%', avg(J) '0%'\", 0), \"No answers yet\")"],
  ];
  for (const [cell, title, formula] of tables) {
    const top = hw.getRange(cell);
    top.setValue(title).setFontWeight('bold').setFontSize(12).setFontColor('#00695c');
    top.offset(1, 0).setFormula(formula);
    top.offset(1, 0, 1, 6).setFontWeight('bold');
  }
  hw.setColumnWidth(1, 40);
  hw.setColumnWidth(2, 380);
  hw.setColumnWidth(7, 24);
  hw.setColumnWidth(8, 230);
  hw.setColumnWidth(12, 24);
  hw.setColumnWidth(13, 200);

  // Red (struggling) to green (got it) on the % columns
  hw.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .setGradientMinpointWithValue('#e67c73', SpreadsheetApp.InterpolationType.NUMBER, '0.4')
      .setGradientMidpointWithValue('#ffd666', SpreadsheetApp.InterpolationType.NUMBER, '0.7')
      .setGradientMaxpointWithValue('#57bb8a', SpreadsheetApp.InterpolationType.NUMBER, '1')
      .setRanges(['J7:K40', 'P7:Q40'].map(a1 => hw.getRange(a1)))
      .build(),
  ]);
}
