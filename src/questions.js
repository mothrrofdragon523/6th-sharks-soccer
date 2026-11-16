// Math questions for the game modes, from the PA Core Grade 5 standards (with a little Grade 6).
// Pick one mode per game: Preseason (5th Grade Review, which is Semi-Final + Championship merged) or
// Times Tables. (The old Preseason set is archived in archive.js.) Each mode has easy, medium
// and hard questions: the further from goal he shoots, the harder the question. Every question has one correct
// answer (a), three wrong ones built from common mistakes, a short explanation (why), and the
// skill it practises (for the progress log).
// A few Championship questions carry a graph for drawGraph() to show on a canvas.

// Semi-Final: one-step computations and word problems (fractions, multiplication, long division)
export const SEMI_FINAL = {
  name: 'Semi-Final',
  blurb: 'One-step computations and word problems: fractions, multiplication, long division',
  easy: [
    { skill: 'Adding & subtracting fractions', q: '1/2 + 1/4 = ?', a: '3/4', wrong: ['2/6', '2/4', '1/8'], why: '1/2 = 2/4, and 2/4 + 1/4 = 3/4.' },
    { skill: 'Adding & subtracting fractions', q: '2/3 − 1/6 = ?', a: '1/2', wrong: ['1/3', '3/9', '5/6'], why: '2/3 = 4/6, and 4/6 − 1/6 = 3/6 = 1/2.' },
    { skill: 'Multi-digit multiplication', q: '34 × 12 = ?', a: '408', wrong: ['102', '398', '418'], why: '34 × 10 = 340 and 34 × 2 = 68. 340 + 68 = 408.' },
    { skill: 'Long division', q: '96 ÷ 12 = ?', a: '8', wrong: ['7', '9', '12'], why: '12 × 8 = 96.' },
    { skill: 'Multiplying fractions', q: '1/2 × 1/3 = ?', a: '1/6', wrong: ['2/5', '1/5', '3/2'], why: 'Multiply the tops (1 × 1) and the bottoms (2 × 3).' },
    { skill: 'Multiplying fractions', q: '3/4 × 20 = ?', a: '15', wrong: ['5', '12', '16'], why: '20 ÷ 4 = 5, and 5 × 3 = 15.' },
    { skill: 'Decimal operations', q: '4.5 + 2.35 = ?', a: '6.85', wrong: ['6.4', '6.75', '68.5'], why: 'Line up the decimal points: 4.50 + 2.35 = 6.85.' },
    { skill: 'Fractions as division', q: 'Which fraction means the same as 3 ÷ 4?', a: '3/4', wrong: ['4/3', '1/12', '7/4'], why: 'A fraction is a division: the top divided by the bottom.' },
    { skill: 'Multi-digit multiplication', q: '205 × 4 = ?', a: '820', wrong: ['800', '8,020', '824'], why: '200 × 4 = 800 and 5 × 4 = 20. 800 + 20 = 820.' },
    { skill: 'Dividing fractions', q: '1/3 ÷ 2 = ?', a: '1/6', wrong: ['2/3', '6', '3/2'], why: 'Split a third into 2 equal parts and each part is a sixth.' },
  ],
  medium: [
    { skill: 'Adding & subtracting fractions', q: 'Sam ran 2/5 mile on Monday and 1/3 mile on Tuesday. How far did he run in all?', a: '11/15 mile', wrong: ['3/8 mile', '2/8 mile', '13/15 mile'], why: '2/5 = 6/15 and 1/3 = 5/15. 6/15 + 5/15 = 11/15.' },
    { skill: 'Adding & subtracting fractions', q: '7/8 of a pizza is left. You eat 1/4 of the whole pizza. How much is left now?', a: '5/8', wrong: ['6/4', '1/2', '3/4'], why: '1/4 = 2/8, and 7/8 − 2/8 = 5/8.' },
    { skill: 'Multi-digit multiplication', q: '28 players each pay $15 for a team bus. How much is collected?', a: '$420', wrong: ['$390', '$320', '$43'], why: '28 × 15 = 280 + 140 = 420.' },
    { skill: 'Long division', q: '624 stickers are shared equally among 24 kids. How many does each kid get?', a: '26', wrong: ['24', '25', '36'], why: '24 × 26 = 624.' },
    { skill: 'Multi-digit multiplication', q: 'A season has 18 games of 90 minutes each. How many minutes is that?', a: '1,620', wrong: ['1,520', '162', '1,800'], why: '18 × 90 = 18 × 9 × 10 = 162 × 10 = 1,620.' },
    { skill: 'Multiplying fractions', q: 'A recipe needs 3/4 cup of sugar. You make half a batch. How much sugar do you need?', a: '3/8 cup', wrong: ['1 1/2 cups', '1/4 cup', '3/4 cup'], why: '1/2 × 3/4 = 3/8.' },
    { skill: 'Fractions as division', q: '5 friends share 3 pizzas equally. How much pizza does each friend get?', a: '3/5 of a pizza', wrong: ['5/3 of a pizza', '1/5 of a pizza', '2/3 of a pizza'], why: '3 ÷ 5 = 3/5.' },
    { skill: 'Dividing fractions', q: '4 liters of water are poured into cups that hold 1/3 liter each. How many cups get filled?', a: '12', wrong: ['7', '4/3', '1/12'], why: 'Each liter fills 3 cups, so 4 × 3 = 12. (4 ÷ 1/3 = 12)' },
    { skill: 'Dividing fractions', q: 'A 1/2-yard ribbon is cut into 4 equal pieces. How long is each piece?', a: '1/8 yard', wrong: ['2 yards', '4 yards', '1/6 yard'], why: '1/2 ÷ 4 = 1/8.' },
    { skill: 'Decimal operations', q: 'A water bottle holds 0.75 liter. How much water do 6 bottles hold?', a: '4.5 liters', wrong: ['4.2 liters', '45 liters', '0.45 liter'], why: '0.75 × 6 = 4.50.' },
  ],
  hard: [
    { skill: 'Adding & subtracting fractions', q: '2 1/2 + 1 2/3 = ?', a: '4 1/6', wrong: ['3 3/5', '3 1/6', '4 1/3'], why: '2 3/6 + 1 4/6 = 3 7/6, and 7/6 = 1 1/6, so 4 1/6.' },
    { skill: 'Adding & subtracting fractions', q: '5 1/4 − 2 3/4 = ?', a: '2 1/2', wrong: ['3 1/2', '2 3/4', '3'], why: 'Rename 5 1/4 as 4 5/4. Then 4 5/4 − 2 3/4 = 2 2/4 = 2 1/2.' },
    { skill: 'Multiplying fractions', q: '2/3 × 3 3/4 = ?', a: '2 1/2', wrong: ['2 1/4', '5 5/8', '2'], why: '3 3/4 = 15/4. 2/3 × 15/4 = 30/12 = 2 1/2.' },
    { skill: 'Long division', q: '3,456 ÷ 27 = ?', a: '128', wrong: ['118', '138', '1,280'], why: '27 × 128 = 3,456.' },
    { skill: 'Multi-digit multiplication', q: '486 × 37 = ?', a: '17,982', wrong: ['17,882', '4,860', '18,982'], why: '486 × 30 = 14,580 and 486 × 7 = 3,402. Add them: 17,982.' },
    { skill: 'Long division', q: 'A stadium has 1,248 seats in 32 equal rows. How many seats are in each row?', a: '39', wrong: ['38', '41', '49'], why: '32 × 39 = 1,248.' },
    { skill: 'Decimal operations', q: '1.2 × 0.4 = ?', a: '0.48', wrong: ['4.8', '0.048', '1.6'], why: '12 × 4 = 48. There are 2 decimal places in the problem, so 2 in the answer.' },
    { skill: 'Decimal operations', q: '7.2 ÷ 0.9 = ?', a: '8', wrong: ['0.8', '80', '6.3'], why: 'Multiply both by 10: 72 ÷ 9 = 8.' },
    { skill: 'Dividing fractions', q: '6 ÷ 1/4 = ?', a: '24', wrong: ['1 1/2', '6 1/4', '4'], why: 'How many quarters fit in 6? There are 4 in each whole, so 6 × 4 = 24.' },
    { skill: 'Multiplying fractions', q: 'One lap of the track is 3/4 mile. You run 2 1/2 laps. How far do you run?', a: '1 7/8 miles', wrong: ['3 1/4 miles', '1 3/4 miles', '2 3/8 miles'], why: '3/4 × 5/2 = 15/8 = 1 7/8.' },
  ],
};

// Championship: order-of-operations word problems, real-world graphs, harder fractions and division
export const CHAMPIONSHIP = {
  name: 'Championship',
  blurb: 'Order-of-operations word problems, real-world graphs, harder fractions and division',
  easy: [
    { skill: 'Order of operations', q: '3 + 4 × 5 = ?', a: '23', wrong: ['35', '12', '60'], why: 'Multiply first: 4 × 5 = 20. Then 3 + 20 = 23.' },
    { skill: 'Order of operations', q: '(8 + 4) ÷ 3 × 2 = ?', a: '8', wrong: ['2', '12', '16'], why: 'Parentheses: 12. Then work left to right: 12 ÷ 3 = 4, and 4 × 2 = 8.' },
    { skill: 'Writing expressions', q: 'You buy 3 jerseys at $12 each and one ball for $8. Which expression shows the total cost?', a: '3 × 12 + 8', wrong: ['3 × (12 + 8)', '3 + 12 × 8', '(3 + 12) × 8'], why: 'Only the jerseys are multiplied by 3. Then add the ball.' },
    { skill: 'Graphing relationships', q: 'A car wash earns $6 per car. On a graph of (cars, dollars), which point belongs?', a: '(5, 30)', wrong: ['(30, 5)', '(5, 11)', '(6, 5)'], why: '5 cars × $6 = $30, so the point is (5, 30). Cars come first.' },
    { skill: 'Reading graphs', q: 'The graph shows a tank filling with water. How many liters are in it after 3 minutes?', a: '6', wrong: ['3', '4', '8'], why: 'Find 3 on the x-axis and go up to the point. It is at 6.',
      graph: { x: 'Minutes', y: 'Liters', series: [{ points: [[0, 0], [1, 2], [2, 4], [3, 6], [4, 8]], line: true }] } },
    { skill: 'Order of operations', q: '2 × [3 + (10 − 4)] = ?', a: '18', wrong: ['12', '24', '16'], why: 'Inside out: 10 − 4 = 6, 3 + 6 = 9, and 2 × 9 = 18.' },
    { skill: 'Order of operations', q: '20 − 12 ÷ 4 = ?', a: '17', wrong: ['2', '5', '14'], why: 'Divide first: 12 ÷ 4 = 3. Then 20 − 3 = 17.' },
    { skill: 'Writing expressions', q: 'Mia has 30 stickers. She gives 6 to each of 4 friends. Which expression shows how many she has left?', a: '30 − 6 × 4', wrong: ['(30 − 6) × 4', '30 − 6 + 4', '30 ÷ 6 × 4'], why: 'She gives away 6 × 4 = 24, so she has 30 − 24 = 6 left.' },
    { skill: 'Writing expressions', q: 'Which expression means "add 6 and 9, then multiply by 4"?', a: '(6 + 9) × 4', wrong: ['6 + 9 × 4', '6 × 4 + 9', '4 + 6 × 9'], why: 'Parentheses make the adding happen first.' },
    { skill: 'Reading graphs', q: 'The graph shows the temperature during a day. When did it rise the most?', a: 'From hour 3 to hour 6', wrong: ['From hour 0 to hour 3', 'From hour 6 to hour 9', 'From hour 9 to hour 12'], why: 'The rises are 8, then 12, then 4 degrees. The steepest climb is from hour 3 to 6.',
      graph: { x: 'Hours after 6 AM', y: 'Temperature (°F)', xStep: 3, yStep: 10, series: [{ points: [[0, 48], [3, 56], [6, 68], [9, 72], [12, 64]], line: true }] } },
  ],
  medium: [
    { skill: 'Order of operations', q: '3/4 + 1/2 × 2/3 = ?', a: '1 1/12', wrong: ['5/6', '1/2', '1 1/3'], why: 'Multiply first: 1/2 × 2/3 = 1/3. Then 3/4 + 1/3 = 9/12 + 4/12 = 13/12.' },
    { skill: 'Multi-step word problems', q: 'Tickets are $8 for kids and $12 for adults. Your family buys 3 kid and 2 adult tickets, then uses a $10 coupon. What is the total?', a: '$38', wrong: ['$48', '$58', '$30'], why: '3 × 8 + 2 × 12 − 10 = 24 + 24 − 10 = 38.' },
    { skill: 'Multi-step word problems', q: 'A team scored 3 goals in each of its first 4 games and 5 goals in each of its next 4 games. What was its average per game?', a: '4', wrong: ['8', '32', '3'], why: '(3 × 4 + 5 × 4) ÷ 8 = 32 ÷ 8 = 4.' },
    { skill: 'Dividing fractions', q: '3/4 ÷ 3/8 = ?', a: '2', wrong: ['9/32', '1/2', '1 1/8'], why: 'How many 3/8s fit in 6/8? Two of them.' },
    { skill: 'Multiplying fractions', q: '2 2/3 × 1 1/2 = ?', a: '4', wrong: ['2 1/3', '4 1/6', '3'], why: '8/3 × 3/2 = 24/6 = 4.' },
    { skill: 'Reading graphs', q: 'The graph shows a bike ride. What happened between hour 2 and hour 3?', a: 'The rider stopped for a break', wrong: ['The rider went the fastest', 'The rider rode back home', 'The rider rode 24 more miles'], why: 'The line is flat, so the distance didn\'t change. The rider wasn\'t moving.',
      graph: { x: 'Hours', y: 'Miles', series: [{ points: [[0, 0], [1, 12], [2, 24], [3, 24], [4, 36]], line: true }] } },
    { skill: 'Graphing relationships', q: 'Snacks cost $3 each. Which points (snacks, dollars) show buying 1, 2 and 3 snacks?', a: '(1, 3), (2, 6), (3, 9)', wrong: ['(3, 1), (6, 2), (9, 3)', '(1, 3), (2, 5), (3, 7)', '(1, 4), (2, 5), (3, 6)'], why: 'Dollars = 3 × snacks, and snacks come first in each pair.' },
    { skill: 'Multi-step word problems', q: 'Coach buys 4 packs of 12 water bottles. The team drinks 30. Coach splits the rest equally into 2 coolers. How many bottles go in each cooler?', a: '9', wrong: ['33', '18', '24'], why: '(4 × 12 − 30) ÷ 2 = (48 − 30) ÷ 2 = 18 ÷ 2 = 9.' },
    { skill: 'Long division', q: '4,815 ÷ 45 = ?', a: '107', wrong: ['17', '117', '1,007'], why: '45 × 100 = 4,500. That leaves 315, and 45 × 7 = 315. So 100 + 7 = 107. (Don\'t forget the 0!)' },
    { skill: 'Multi-digit multiplication', q: 'A stadium has 125 sections with 216 seats in each. How many seats is that?', a: '27,000', wrong: ['2,700', '26,000', '270,000'], why: '125 × 216 = 125 × 8 × 27 = 1,000 × 27 = 27,000.' },
    { skill: 'Order of operations', q: '{2 + [18 ÷ (5 − 2)]} × 3 = ?', a: '24', wrong: ['20', '12', '36'], why: '5 − 2 = 3. Then 18 ÷ 3 = 6, 2 + 6 = 8, and 8 × 3 = 24.' },
  ],
  hard: [
    { skill: 'Multi-step word problems', q: 'In a 12-mile race, Kai runs 1/3 of the distance and then walks 1/4 of it. How many miles are left?', a: '5', wrong: ['7', '6', '8'], why: '1/3 of 12 = 4 and 1/4 of 12 = 3. 12 − 4 − 3 = 5.' },
    { skill: 'Multiplying fractions', q: 'A recipe for 6 people needs 2 1/4 cups of flour. How much flour do you need for 4 people?', a: '1 1/2 cups', wrong: ['1 1/4 cups', '3 3/8 cups', '2 cups'], why: '4 people is 4/6 = 2/3 of the recipe. 9/4 × 2/3 = 18/12 = 1 1/2.' },
    { skill: 'Reading graphs', q: 'The graph shows savings each week. If the pattern continues, how much will be saved after week 7?', a: '$125', wrong: ['$105', '$110', '$140'], why: 'Start at $20 and add $15 each week: 20 + 15 × 7 = 125.',
      graph: { x: 'Week', y: 'Dollars saved', series: [{ points: [[0, 20], [1, 35], [2, 50], [3, 65], [4, 80]], line: true }] } },
    { skill: 'Graphing relationships', q: 'The rule is y = 2 × x + 1. Which point is NOT on its graph?', a: '(3, 6)', wrong: ['(0, 1)', '(2, 5)', '(4, 9)'], why: 'When x = 3, y = 2 × 3 + 1 = 7, not 6.' },
    { skill: 'Dividing fractions', q: '5/6 ÷ 1 1/4 = ?', a: '2/3', wrong: ['1 1/24', '3/2', '5/24'], why: '1 1/4 = 5/4. Flip and multiply: 5/6 × 4/5 = 20/30 = 2/3.' },
    { skill: 'Dividing fractions', q: 'A roll of tape is 15 3/4 feet long. How many 3/4-foot pieces can you cut from it?', a: '21', wrong: ['20', '12', '11 13/16'], why: '63/4 ÷ 3/4 = 63 ÷ 3 = 21.' },
    { skill: 'Order of operations', q: '48 ÷ (6 + 2) × 3 − 2² = ?', a: '14', wrong: ['16', '2', '22'], why: '(6 + 2) = 8, and 2² = 4. Then 48 ÷ 8 = 6, 6 × 3 = 18, and 18 − 4 = 14.' },
    { skill: 'Multi-step word problems', q: 'Cleats cost $64.50 and are on sale for 1/3 off. You pay with $50. How much change do you get?', a: '$7.00', wrong: ['$28.50', '$14.50', '$21.50'], why: '1/3 of 64.50 is 21.50, so you pay 43.00. Then 50 − 43 = 7.' },
    { skill: 'Long division', q: 'A school raised $2,856 to split equally among 34 teams. How much does each team get?', a: '$84', wrong: ['$83', '$74', '$94'], why: '34 × 84 = 2,856.' },
    { skill: 'Reading graphs', q: 'Runner A (solid) and Runner B (dashed) race. After how many minutes are they tied?', a: '2', wrong: ['1', '3', '0'], why: 'Both lines meet at (2, 300). Each runner has gone 300 meters.',
      graph: { x: 'Minutes', y: 'Meters', xStep: 1, series: [
        { label: 'A', points: [[0, 0], [1, 150], [2, 300], [3, 450]], line: true },
        { label: 'B', points: [[0, 100], [1, 200], [2, 300], [3, 400]], line: true, dashed: true },
      ] } },
  ],
};

// 5th Grade Review: the old Regular Season and Playoffs questions, merged (easy with easy, and so on).
export const FIFTH_GRADE_REVIEW = {
  name: '5th Grade Review',
  blurb: 'Fractions, multi-digit multiplication, long division, order of operations, word problems and graphs',
  easy: [...SEMI_FINAL.easy, ...CHAMPIONSHIP.easy],
  medium: [...SEMI_FINAL.medium, ...CHAMPIONSHIP.medium],
  hard: [...SEMI_FINAL.hard, ...CHAMPIONSHIP.hard],
};

// Times Tables: just the 7s, 9s, 11s and 12s (3 × to 12 ×), built here rather than written out.
// Most questions are fill in the blank, typed on the number pad: 7 × ___ = 56 or ___ × 7 = 56.
// The rest are plain facts (7 × 8 = ?), also typed, so he has to recall them either way.
// Easy is the 7 and 9 tables; medium the 11 and 12 tables; hard mixes all four, using only the
// tough factors (6 to 12).
// Every question about the same fact (7 × 3, 3 × 7, ___ × 7 = 21...) shares a group, and a game never
// asks two questions from one group (see QuestionDeck).
const factGroup = (a, b) => `${Math.min(a, b)}x${Math.max(a, b)}`;

const blank = (a, b, blankFirst) => ({
  group: factGroup(a, b),
  skill: `${b} times table`,
  q: blankFirst ? `___ × ${b} = ${a * b}` : `${b} × ___ = ${a * b}`,
  a: String(a),
  typed: true,
  why: `${a * b} ÷ ${b} = ${a}, because ${a} × ${b} = ${a * b}.`,
});

const fact = (a, b) => ({
  group: factGroup(a, b),
  skill: `${b} times table`,
  q: `${a} × ${b} = ?`,
  a: String(a * b),
  typed: true,
  why: `${a} groups of ${b} make ${a * b}. Check: ${a * b} ÷ ${b} = ${a}.`,
});

// Each factor gets a blank on either side plus a plain fact, so 2 of every 3 questions are blanks.
const tables = (ts, from = 3) => ts.flatMap(t => Array.from({ length: 13 - from }, (_, i) =>
  [blank(i + from, t, true), blank(i + from, t, false), fact(i + from, t)])).flat();

export const TIMES_TABLES = {
  name: 'Times Tables',
  blurb: 'The 7s, 9s, 11s and 12s',
  easy: tables([7, 9]),
  medium: tables([11, 12]),
  hard: tables([7, 9, 11, 12], 6),
};

// Every question set, by name.
export const MODES = { fifthGradeReview: FIFTH_GRADE_REVIEW, semiFinal: SEMI_FINAL, championship: CHAMPIONSHIP, timesTables: TIMES_TABLES };

// The value of a numeric answer like "1,620", "$7.00", "4.5 liters", "3/8 cup", "1 7/8 miles" or "20%",
// with its unit ("liter", "cup", "mile", "%"). Null for anything else, like "(4, 12)" or "Rectangle".
function numeric(text) {
  const m = String(text).trim().replace(/,/g, '')
    .match(/^\$?(?:(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d*\.?\d+))\s*([a-z %]*)$/i);
  if (!m) return null;
  const value = m[1] ? +m[1] + m[2] / m[3] : m[4] ? m[4] / m[5] : +m[6];
  return { value, unit: m[7].trim().toLowerCase().replace(/s$/, '') };
}

// How far a wrong answer is from the right one, as a fraction of the right answer
// (0.05 = 5% off), or null if the answers aren't numbers that can be compared.
// A typed answer has no unit, so it's compared with the number alone.
export const howFarOff = (given, right) => {
  const g = numeric(given), r = numeric(right);
  if (!g || !r || (g.unit && g.unit !== r.unit)) return null;
  return Math.abs(g.value - r.value) / Math.max(Math.abs(r.value), 1e-9);
};

// Does a typed answer match? Commas and spaces don't matter, and 4.50 matches 4.5.
// Units are left off when typing, so 6.3 matches "6.3 ounces" and 20 matches "20%".
// Fractions have to match as written (so 2/4 doesn't count for 1/2).
export const sameAnswer = (given, right) => {
  const tidy = s => String(s).replace(/\s*[a-z][a-z ]*$/i, '').replace(/[,\s$%]/g, '');
  const g = tidy(given), r = tidy(right);
  return g === r || (/^\d*\.?\d+$/.test(g) && /^\d*\.?\d+$/.test(r) && Number(g) === Number(r));
};

const shuffle = list => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// One per game, for the mode he picked, e.g. new QuestionDeck(MODES.semiFinal).
// Never repeats a question until that level runs out, and never asks two questions with the same
// `group` (the same times-table fact in a different form) in one game, unless a level has run out of others.
export class QuestionDeck {
  constructor(mode) {
    this.mode = mode;
    this.used = new Set();
    this.groups = new Set(); // groups already asked this game
    this.opened = false;
  }

  // Returns { q, skill, choices, answer (index into choices), rightAnswer (its text),
  // typed, why, graph?, level }. Typed questions have no choices: he enters the answer.
  // level is 'easy', 'medium' or 'hard'.
  next(level) {
    // Some sets open every game with the same fill-in-the-blank vocabulary review (mode.opener),
    // then carry on with the usual questions. Its blanks and word bank come back as `blanks`.
    if (this.mode.opener && !this.opened) {
      this.opened = true;
      const { q, skill, why, bank, parts } = this.mode.opener;
      return { q, skill, choices: [], answer: -1, rightAnswer: parts.map(p => p.a).join(', '), typed: false, blanks: { bank, parts }, why, level };
    }
    const pool = this.mode[level];
    const isFresh = item => !this.used.has(item) && !(item.group && this.groups.has(item.group));
    let fresh = pool.filter(isFresh);
    if (!fresh.length) { // this level has run out: start it over
      pool.forEach(item => { this.used.delete(item); if (item.group) this.groups.delete(item.group); });
      fresh = pool;
    }
    const item = fresh[(Math.random() * fresh.length) | 0];
    this.used.add(item);
    if (item.group) this.groups.add(item.group);
    const choices = item.typed ? [] : shuffle([item.a, ...item.wrong]);
    return { q: item.q, skill: item.skill, choices, answer: choices.indexOf(item.a), rightAnswer: item.a, typed: !!item.typed, why: item.why, graph: item.graph, level };
  }
}

// Draws a first-quadrant graph onto a canvas, sized to fit its data.
export function drawGraph(canvas, graph, colors = ['#004c54', '#c0392b']) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const labelled = graph.series.some(s => s.label);
  const pad = { l: 56, r: labelled ? 34 : 16, t: 16, b: 44 };
  const pts = graph.series.flatMap(s => s.points);
  const niceStep = max => {
    const raw = max / 6, p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map(m => m * p).find(s => s >= raw);
  };
  const xStep = graph.xStep ?? niceStep(Math.max(...pts.map(p => p[0])));
  const yStep = graph.yStep ?? niceStep(Math.max(...pts.map(p => p[1])));
  const xMax = Math.ceil(Math.max(...pts.map(p => p[0])) / xStep) * xStep;
  const yMax = Math.ceil(Math.max(...pts.map(p => p[1])) / yStep) * yStep;
  const px = x => pad.l + (x / xMax) * (W - pad.l - pad.r);
  const py = y => H - pad.b - (y / yMax) * (H - pad.t - pad.b);

  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  g.font = '13px system-ui, sans-serif';
  g.lineWidth = 1;
  g.strokeStyle = '#e3e3e3';
  g.fillStyle = '#555';
  g.textAlign = 'center';
  for (let x = 0; x <= xMax; x += xStep) {
    g.beginPath(); g.moveTo(px(x), py(0)); g.lineTo(px(x), py(yMax)); g.stroke();
    g.fillText(x, px(x), H - pad.b + 18);
  }
  g.textAlign = 'right';
  for (let y = 0; y <= yMax; y += yStep) {
    g.beginPath(); g.moveTo(px(0), py(y)); g.lineTo(px(xMax), py(y)); g.stroke();
    g.fillText(y, pad.l - 8, py(y) + 4);
  }
  g.strokeStyle = '#333';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(px(0), py(yMax)); g.lineTo(px(0), py(0)); g.lineTo(px(xMax), py(0)); g.stroke();
  g.fillStyle = '#333';
  g.textAlign = 'center';
  g.fillText(graph.x, (pad.l + W - pad.r) / 2, H - 8);
  g.save();
  g.translate(14, (pad.t + H - pad.b) / 2);
  g.rotate(-Math.PI / 2);
  g.fillText(graph.y, 0, 0);
  g.restore();

  graph.series.forEach((s, i) => {
    const color = colors[i % colors.length];
    g.strokeStyle = g.fillStyle = color;
    g.lineWidth = 2.5;
    if (s.line) {
      g.setLineDash(s.dashed ? [8, 6] : []);
      g.beginPath();
      s.points.forEach(([x, y], k) => (k ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))));
      g.stroke();
      g.setLineDash([]);
    }
    s.points.forEach(([x, y]) => { g.beginPath(); g.arc(px(x), py(y), 4.5, 0, Math.PI * 2); g.fill(); });
    if (s.label) {
      const [x, y] = s.points[s.points.length - 1];
      g.textAlign = 'left';
      g.font = 'bold 14px system-ui, sans-serif';
      g.fillText(s.label, px(x) + 9, py(y) + 5);
    }
  });
}
