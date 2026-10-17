// Homework: the exact problems from his current worksheet, asked in worksheet order.
// Replace HOMEWORK with each new worksheet. Each problem has:
//   n     its number on the worksheet, so he can match it up
//   skill what it practises (for the progress sheet)
//   q     the problem, word for word
//   q     problems that lean on a picture get the picture's numbers written in
//   a     the answer, written the way the worksheet wants it
//   typed true: he fills in the answer on the number pad (digits . / − and commas). Homework
//         should always be fill-in, so every problem he can answer with those keys is typed.
//         A unit or % after the number is shown but not typed, so 6.3 matches "6.3 ounces".
//   accept other typed answers that also count (optional)
//   paper  true for a problem the pad can't check (like "describe the pattern"): it isn't asked
//         in the game, but its example answer is in the answers list at the end
//   why   a short explanation
// A problem that asks two things is split in two (2B-1, 2B-2), so each has one answer.
// Keep apostrophes out of the title: the progress sheet matches worksheets by it.
export const HOMEWORK = {
  title: 'Lesson 7.2 Percent of a Quantity',
  problems: [
    // Page 219
    { n: '1', skill: 'Percent of a number', q: 'A football team scored 80% of a total of 500 points in its first 11 games. How many points is 80% of 500?', a: '400', typed: true,
      why: 'Split 500 into ten 10% parts of 50. Eight parts: 8 × 50 = 400. (Shade 8 boxes of the model on your paper.)' },
    { n: '2A', skill: 'Percent word problems', q: 'About 71% of Earth\'s surface is covered in water. Earth\'s surface is about 196,900,000 square miles. About how many square miles are covered in water?',
      a: '139,799,000 square miles', typed: true,
      why: '71% = 0.71, and 0.71 × 196,900,000 = 139,799,000.' },
    { n: '2B-1', skill: 'Percent word problems', q: 'About 71% of Earth\'s surface is covered in water. About what percent is NOT covered in water?',
      a: '29%', typed: true, why: 'The whole surface is 100%, and 100% − 71% = 29%.' },
    { n: '2B-2', skill: 'Percent word problems', q: 'Earth\'s surface is about 196,900,000 square miles, and 29% of it is not covered in water. How many square miles is that?',
      a: '57,101,000 square miles', typed: true,
      why: '0.29 × 196,900,000 = 57,101,000. (Or 196,900,000 − 139,799,000 from 2A.)' },
    { n: '3', skill: 'Percent word problems', q: 'A metal bar weighs 7.5 ounces. Silver is 84% of its weight. How much does the silver weigh?', a: '6.3 ounces', typed: true,
      why: '84% = 0.84, and 0.84 × 7.5 = 6.3.' },
    { n: '4', skill: 'Percent word problems', q: 'The same 7.5-ounce bar is 9% iron. How much does the iron weigh?', a: '0.675 ounce', typed: true,
      why: '9% = 0.09, and 0.09 × 7.5 = 0.675. Keep all three decimal places to be precise.' },
    { n: '5', skill: 'Percent of a number', q: 'Find 30% of 180.', a: '54', typed: true,
      why: '10% of 180 is 18, so 30% is 3 × 18 = 54.' },
    { n: '6A', skill: 'Finding 10%', q: '10% of 30 is ?', a: '3', typed: true, why: '10% means divide by 10: 30 ÷ 10 = 3.' },
    { n: '6B', skill: 'Finding 10%', q: '10% of 47 is ?', a: '4.7', typed: true, why: '47 ÷ 10 = 4.7. The decimal point moves one place left.' },
    { n: '6C', skill: 'Finding 10%', q: '10% of 240 is ?', a: '24', typed: true, why: '240 ÷ 10 = 24.' },
    { n: '6D', skill: 'Finding 10%', q: '10% of 10.8 is ?', a: '1.08', typed: true, why: '10.8 ÷ 10 = 1.08. The decimal point moves one place left.' },
    { n: '6E', skill: 'Finding 10%', q: 'Look at 6A to 6D. Describe the pattern you notice when you find 10% of a number.', paper: true,
      a: 'Finding 10% is the same as dividing by 10, so the decimal point moves one place to the left.',
      why: 'Look at your answers: 30 → 3, 47 → 4.7, 240 → 24, 10.8 → 1.08. Every time, the decimal point moved one place left.' },
    { n: '7', skill: 'Percent of a number', q: '10% of 90 = ?', a: '9', typed: true, why: '90 ÷ 10 = 9.' },
    { n: '8', skill: 'Percent of a number', q: '50% of 14 = ?', a: '7', typed: true, why: '50% is half. Half of 14 is 7.' },
    { n: '9', skill: 'Percent of a number', q: '30% of 90 = ?', a: '27', typed: true, why: '10% of 90 is 9, so 30% is 3 × 9 = 27.' },
    { n: '10', skill: 'Percent of a number', q: '80% of 40 = ?', a: '32', typed: true, why: '10% of 40 is 4, so 80% is 8 × 4 = 32.' },
    // Page 220
    { n: '11a', skill: 'Percent word problems', q: '140 people went to a movie. 40% bought popcorn. How many people bought popcorn?', a: '56', typed: true,
      why: '10% of 140 is 14, so 40% is 4 × 14 = 56.' },
    { n: '11b', skill: 'Percent word problems', q: '140 people went to a movie. 30% bought pretzels. How many people bought pretzels?', a: '42', typed: true,
      why: '10% of 140 is 14, so 30% is 3 × 14 = 42.' },
    { n: '11c', skill: 'Percent word problems', q: '140 people went to a movie. 10% bought pizza. How many people bought pizza?', a: '14', typed: true,
      why: '10% of 140 is 140 ÷ 10 = 14.' },
    { n: '12', skill: 'Percent word problems', q: 'A circle graph shows the winner of an election got 63% of the votes. There were 6,350 votes in all. About how many votes did the winner get?',
      a: '4,000 votes', typed: true, accept: ['4000.5'],
      why: '0.63 × 6,350 = 4,000.5, which is about 4,000. (That\'s choice C on your paper.)' },
    { n: '13', skill: 'Percent word problems', q: 'There are 80 marbles in a bag. 30% of them are green. How many marbles are NOT green?', a: '56', typed: true,
      why: '100% − 30% = 70% are not green. 10% of 80 is 8, so 70% is 7 × 8 = 56.' },
    { n: '14', skill: 'Percent word problems', q: 'Lamar earns $150 in all. 40% of it is from moving furniture. How much did he earn moving furniture?',
      a: '$60', typed: true,
      why: '10% of 150 is 15, so 40% is 4 × 15 = 60. (That\'s choice B on your paper.)' },
    { n: '15', skill: 'Finding the percent', q: 'Three of 15 judges voted for Barry. What percent of the judges voted for him?', a: '20%', typed: true,
      why: '3/15 = 1/5, and 1/5 = 20/100 = 20%.' },
    { n: '16', skill: 'Long division', q: 'A bakery puts 868 muffins into 31 boxes, the same number in each. How many muffins are in each box?', a: '28', typed: true,
      why: '868 ÷ 31 = 28. Check: 31 × 28 = 868.' },
    { n: '17', skill: 'Ordering integers', q: 'Order the numbers 0, 3, −12 and −1 from least to greatest. Use the − and , keys.',
      a: '−12, −1, 0, 3', typed: true,
      why: 'Negative numbers are less than 0, and −12 is farther below 0 than −1.' },
    { n: '18', skill: 'Dividing decimals', q: '560 ÷ 1.4 = ? (Round to the nearest thousandth if you need to.)', a: '400', typed: true,
      why: 'Multiply both by 10: 5,600 ÷ 14 = 400.' },
    { n: '19', skill: 'Dividing decimals', q: '9.5 ÷ 500 = ? (Round to the nearest thousandth if you need to.)', a: '0.019', typed: true,
      why: '9.5 ÷ 500 = 0.019. It comes out exactly, so no rounding.' },
    { n: '20', skill: 'Dividing decimals', q: '0.80 ÷ 46 = ? (Round to the nearest thousandth.)', a: '0.017', typed: true,
      why: '0.80 ÷ 46 = 0.01739… The ten-thousandths digit is 3, so round down to 0.017.' },
    { n: '21', skill: 'Dividing decimals', q: '10.2 ÷ 100 = ? (Round to the nearest thousandth if you need to.)', a: '0.102', typed: true,
      why: 'Dividing by 100 moves the decimal point 2 places left: 0.102.' },
    { n: '22', skill: 'Dividing decimals', q: '0.72 ÷ 0.09 = ? (Round to the nearest thousandth if you need to.)', a: '8', typed: true,
      why: 'Multiply both by 100: 72 ÷ 9 = 8.' },
    { n: '23', skill: 'Dividing decimals', q: '13 ÷ 0.04 = ? (Round to the nearest thousandth if you need to.)', a: '325', typed: true,
      why: 'Multiply both by 100: 1,300 ÷ 4 = 325.' },
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
  // and the ones that are only done on paper.
  next() {
    const list = this.homework.problems.filter(p => !p.paper);
    let i = this.progress.next % list.length;
    for (let k = 0; k < list.length; k++) {
      const j = (this.progress.next + k) % list.length;
      if (this.progress.status[list[j].n] !== 'first') { i = j; break; }
    }
    this.progress.next = i + 1;
    this.save();
    const item = list[i];
    const choices = item.typed ? [] : shuffle([item.a, ...item.wrong]);
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
