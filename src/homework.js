// Homework: the exact problems from his current worksheet, asked in worksheet order.
// Replace HOMEWORK with each new worksheet. Each problem has:
//   n     its number on the worksheet, so he can match it up
//   skill what it practises (for the progress sheet)
//   q     the problem, word for word
//   q     problems that lean on a picture get the picture's numbers written in
//   a     the answer, written the way the worksheet wants it
//   typed true: he fills in the answer on the number pad (digits . / − and commas), for
//         problems that are fill-in on the page. A unit or % after the number is shown but not
//         typed, so 6.3 matches "6.3 ounces". When a is a ratio like 2:5, the pad has a : key
//         in place of the comma.
//   choices for problems with choices on the page (A–D, or a word box): the choices in the
//         page's order, shown in that order. a is the right one.
//   accept other typed answers that also count (optional)
//   notebook true for written answers he writes in his notebook (like science questions): the
//         game shows the question and an "I wrote it" button, and counts it as right. a is an
//         example answer for the answer key only; the game doesn't show it.
//   paper  true for a problem the pad can't check (like "describe the pattern"): it isn't asked
//         in the game, but its example answer is in the answers list at the end
//   why   a short explanation
// A problem that asks two things is split in two (2B-1, 2B-2), so each has one answer.
// Keep apostrophes out of the title: the progress sheet matches worksheets by it.
const TF = ['True', 'False'];
const BREAD = 'A bread recipe uses 2 cups of white flour and 5 cups of whole wheat flour. True or false:';

export const HOMEWORK = {
  title: 'Ratios Test Prep and Spiral Review',
  problems: [
    // Test Prep (7 is left out)
    { n: '8', typed: true, skill: 'Writing ratios', q: 'A furniture builder pays $100 for the materials necessary to build one porch swing. A store sells the swing for $250. What is the ratio of the cost in dollars of the materials to the sale price in dollars?',
      a: '2:5', accept: ['100:250', '20:50', '10:25', '2/5', '100/250'], why: 'Materials to sale price is 100:250. Divide both by 50 to get 2:5.' },
    { n: '9', typed: true, skill: 'Writing ratios', q: 'Andre is writing a paper for science class. He can type 30 words per minute. What is the ratio of words to minutes?',
      a: '30:1', accept: ['30/1'], why: '30 words in 1 minute, so words to minutes is 30:1.' },
    { n: '10A', skill: 'Ratios', q: `${BREAD} The ratio of white flour to whole wheat flour is 2 to 5.`, choices: TF,
      a: 'True', why: '2 cups white to 5 cups whole wheat is 2 to 5.' },
    { n: '10B', skill: 'Ratios', q: `${BREAD} The ratio of whole wheat flour to total flour is 5:7.`, choices: TF,
      a: 'True', why: 'There are 2 + 5 = 7 cups in all, and 5 of them are whole wheat, so 5:7.' },
    { n: '10C', skill: 'Ratios', q: `${BREAD} For every 2 cups of white flour, there are 3 cups of whole wheat flour.`, choices: TF,
      a: 'False', why: 'For every 2 cups of white flour there are 5 cups of whole wheat, not 3.' },
    { n: '10D', skill: 'Ratios', q: `${BREAD} For every 7 cups of flour, there are 2 cups of white flour.`, choices: TF,
      a: 'True', why: '7 cups in all, and 2 of them are white flour.' },
    { n: '10E', skill: 'Ratios', q: `${BREAD} For each cup of white flour, there are 4 cups of whole wheat flour.`, choices: TF,
      a: 'False', why: '5 ÷ 2 = 2.5, so there are 2.5 cups of whole wheat for each cup of white, not 4.' },
    // Spiral Review
    { n: '11', typed: true, skill: 'Dividing multi-digit numbers', q: 'Viktor purchases a car for $10,608. He makes monthly payments for 48 months in order to pay off the car. He does not pay interest. How much are his payments each month?',
      a: '$221', why: '10,608 ÷ 48 = 221, so he pays $221 a month.' },
    { n: '12', typed: true, skill: 'Decimal word problems', q: 'A professional running track has two straight sections that are each 328.084 feet long. The total distance around the track is 1,312.34 feet. What is the length of the part of the track that is not straight?',
      a: '656.172 feet', why: 'The two straights are 2 × 328.084 = 656.168 feet. 1,312.34 − 656.168 = 656.172 feet.' },
    { n: '13', typed: true, skill: 'Greatest common factor', q: 'What is the greatest common factor of 72 and 34?',
      a: '2', why: '34 = 2 × 17 and 72 = 2 × 36. 17 is not a factor of 72, so the greatest common factor is 2.' },
  ],
};

// What he's done on each problem of this worksheet, kept on this device so it carries over
// between games: 'first' (right on the first try), 'solved' (right after a retry) or 'shown'
// (he ran out of tries). Only his best result is kept.
const RANK = { shown: 1, solved: 2, first: 3 };

const shuffle = list => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class HomeworkDeck {
  constructor(homework) {
    this.homework = homework;
    this.key = `sss-homework-${homework.title}-${homework.problems.length}`;
    try { this.progress = JSON.parse(localStorage.getItem(this.key)); } catch { /* storage unavailable */ }
    if (!this.progress) this.progress = { next: 0, status: {} };
  }

  // Same shape as QuestionDeck.next(). Goes in worksheet order from where he left off,
  // skipping problems he's already got right on the first try (unless he has them all),
  // and the ones that are only done on paper. progress.next is a place in the whole worksheet
  // (paper problems included), so marking a problem paper-only doesn't move where he is.
  next() {
    const list = this.homework.problems;
    const order = list.map((_, k) => (this.progress.next + k) % list.length).filter(j => !list[j].paper);
    const i = order.find(j => this.progress.status[list[j].n] !== 'first') ?? order[0];
    this.progress.next = i + 1;
    this.save();
    const item = list[i];
    const choices = item.typed || item.notebook ? [] : item.choices ? [...item.choices] : shuffle([item.a, ...item.wrong]);
    return {
      q: item.q, skill: item.skill, choices, answer: choices.indexOf(item.a), rightAnswer: item.a,
      typed: !!item.typed, accept: item.accept, why: item.why, graph: item.graph,
      level: 'homework', tag: `#${item.n}`, n: item.n, homework: true, notebook: !!item.notebook,
    };
  }

  done(n, result) {
    const old = this.progress.status[n];
    if (!old || RANK[result] > RANK[old]) this.progress.status[n] = result;
    this.save();
  }

  status(n) {
    return this.progress.status[n] || null;
  }

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.progress)); } catch { /* storage unavailable */ }
  }
}
