// Homework: the exact problems from his current worksheet, asked in worksheet order.
// Replace HOMEWORK with each new worksheet. Each problem has:
//   n     its number on the worksheet, so he can match it up
//   skill what it practises (for the progress sheet)
//   q     the problem, word for word
//   q     problems that lean on a picture get the picture's numbers written in
//   a     the answer, written the way the worksheet wants it
//   typed true: he fills in the answer on the number pad (digits . / − and commas), for
//         problems that are fill-in on the page. A unit or % after the number is shown but not
//         typed, so 6.3 matches "6.3 ounces".
//   choices for problems with choices on the page (A–D, or a word box): the choices in the
//         page's order, shown in that order. a is the right one.
//   accept other typed answers that also count (optional)
//   paper  true for a problem the pad can't check (like "describe the pattern"): it isn't asked
//         in the game, but its example answer is in the answers list at the end
//   why   a short explanation
// A problem that asks two things is split in two (2B-1, 2B-2), so each has one answer.
// Keep apostrophes out of the title: the progress sheet matches worksheets by it.
// The Vocabulary box, in the page's order
const VOCAB = ['sum', 'difference', 'divisor', 'dividend', 'equivalent', 'remainder'];

export const HOMEWORK = {
  title: 'Module 4 Review',
  problems: [
    // Vocabulary: choose the correct term from the Vocabulary box
    { n: '1a', skill: 'Division vocabulary', q: 'In the problem 3.8 ÷ 0.7, the number 3.8 is the ____.', a: 'dividend', choices: VOCAB,
      why: 'The dividend is the number being divided. In 3.8 ÷ 0.7, that\'s 3.8.' },
    { n: '1b', skill: 'Division vocabulary', q: 'In the problem 3.8 ÷ 0.7, the number 0.7 is the ____.', a: 'divisor', choices: VOCAB,
      why: 'The divisor is the number you divide by. In 3.8 ÷ 0.7, that\'s 0.7.' },
    { n: '2', skill: 'Math vocabulary', q: 'The solution to an addition problem is called the ____.', a: 'sum', choices: VOCAB,
      why: 'Adding gives a sum: in 4 + 5 = 9, the sum is 9.' },
    { n: '3', skill: 'Math vocabulary', q: 'The solution to a subtraction problem is called the ____.', a: 'difference', choices: VOCAB,
      why: 'Subtracting gives a difference: in 9 − 5 = 4, the difference is 4.' },
    { n: '4', skill: 'Division vocabulary', q: 'Two division expressions that have the same value are ____.', a: 'equivalent', choices: VOCAB,
      why: 'Equivalent means equal in value. 3.8 ÷ 0.7 and 38 ÷ 7 are equivalent.' },
    // Concepts and Skills
    { n: '5', skill: 'Adding decimals', q: 'The distance from Jose\'s home to school is 1.85 miles. The school is 2.34 miles from the local library, which is 1.9 miles from Jose\'s home. If Jose goes from his home to school, from school to the library, and then home, how far does he travel?',
      a: '6.09 miles', typed: true,
      why: 'Add all three trips, lining up the decimal points: 1.85 + 2.34 + 1.90 = 6.09.' },
    { n: '6', skill: 'Dividing multi-digit numbers', q: 'An airplane flew a total of 6,240 miles. Its speed was 520 miles per hour. How many hours did the plane fly?',
      a: '12 hours', typed: true,
      why: 'Total miles ÷ miles per hour: 6,240 ÷ 520 = 12. Check: 520 × 12 = 6,240.' },
    { n: '7', skill: 'Decimal word problems', q: 'Telegraphs were used to send messages before the telephone was invented. A telegraph operator could interpret about 40 words sent in Morse code per minute. Approximately how many words sent in Morse code could the operator interpret in 12.5 seconds?',
      a: '8 words', paper: true, // taken out of the game on 2026-10-21; he finishes it on paper
      why: 'A minute is 60 seconds, so that\'s 40 ÷ 60 ≈ 0.67 word each second. 12.5 × 0.67 ≈ 8 words. On paper, also say your strategy and tool (like dividing with paper and pencil) and why you chose it.' },
    { n: '8', skill: 'Dividing decimals', q: 'Which has a quotient of 0.6?', a: '0.204 ÷ 0.34',
      choices: ['0.204 ÷ 0.034', '0.204 ÷ 0.34', '2.04 ÷ 0.034', '2.04 ÷ 0.34'],
      why: 'Multiply both by 100: 0.204 ÷ 0.34 = 20.4 ÷ 34 = 0.6. (The others come to 6, 60 and 6.)' },
    { n: '9A', skill: 'Decimal word problems', q: 'The ocean rises and falls each day due to tides. The Bay of Fundy in Canada has some of the highest tides in the world. Its tidewater rises about 53.478 feet and falls the same amount afterwards, twice a day. How many total feet does the tide rise and fall each day?',
      a: '213.912 feet', typed: true,
      why: 'Twice a day it rises 53.478 and falls 53.478, so that\'s 4 of them: 4 × 53.478 = 213.912. On paper, write the expression: 4 × 53.478.' },
    { n: '9B', skill: 'Writing expressions', paper: true, q: 'Write an expression that can be used to find the total feet the tide rises and falls over a one-week period.',
      a: '7 × (4 × 53.478)',
      why: 'One day is 4 × 53.478 feet, and a week is 7 days.' },
    { n: '9C', skill: 'Decimal word problems', q: 'The tide rises and falls 4 × 53.478 = 213.912 feet each day. How many total feet does the tide rise and fall over a one-week period?',
      a: '1,497.384 feet', typed: true,
      why: '7 days × 213.912 feet = 1,497.384 feet.' },
    { n: '10', skill: 'Writing expressions', q: 'A 0.5-pound bunch of bananas costs $0.22 and 1 pound of oranges cost $2.39. If a person has $20, which expression could be used to determine how much change the person would get after purchasing the 0.5-pound bunch of bananas and 3.25 pounds of oranges?',
      a: '20 − [0.22 + (3.25 × 2.39)]',
      choices: ['20 − 0.22 + (2.39 × 3.25)', '0.22 + (2.39 × 3.25) − 20', '20 − [0.22 + (3.25 × 2.39)]', '0.22 + (0.5 × 3.25) − 20'],
      why: 'Add up what\'s spent first (bananas $0.22 + 3.25 pounds of oranges at $2.39), then take all of it away from $20. The brackets keep the spending together.' },
    { n: '11', skill: 'Dividing decimals', q: 'A bag of equally-sized rhinestones weighs 16 ounces. Each rhinestone weighs 0.016 ounce. If you have 2 bags of rhinestones, how many rhinestones do you have?',
      a: '2,000 rhinestones', typed: true,
      why: 'One bag: 16 ÷ 0.016 = 16,000 ÷ 16 = 1,000 rhinestones. Two bags: 2 × 1,000 = 2,000.' },
    { n: '12', skill: 'Order of operations', q: 'What is the value of the expression? 7.09 − (1.36 × 4.125) + (3.28 ÷ 0.04)', a: '83.48',
      choices: ['8.85', '9.68', '83.39', '83.48'],
      why: 'Parentheses first: 1.36 × 4.125 = 5.61 and 3.28 ÷ 0.04 = 82. Then left to right: 7.09 − 5.61 = 1.48, and 1.48 + 82 = 83.48.' },
    { n: '13', skill: 'Decimal word problems', q: 'Remy is saving money to buy a new video game console. The console costs $199.95. Remy makes $40.50 each week babysitting. How many total weeks will he need to babysit to save up enough money for the video game console?',
      a: '5 weeks', typed: true,
      why: '199.95 ÷ 40.50 ≈ 4.94, so 4 weeks isn\'t enough (4 × 40.50 = $162). He needs 5 weeks (5 × 40.50 = $202.50). Write this reasoning on paper.' },
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
    const choices = item.typed ? [] : item.choices ? [...item.choices] : shuffle([item.a, ...item.wrong]);
    return {
      q: item.q, skill: item.skill, choices, answer: choices.indexOf(item.a), rightAnswer: item.a,
      typed: !!item.typed, accept: item.accept, why: item.why, graph: item.graph,
      level: 'homework', tag: `#${item.n}`, n: item.n, homework: true,
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
