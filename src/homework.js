// Homework: the exact problems from his current worksheet, asked in worksheet order.
// Replace HOMEWORK with each new worksheet. Each problem has:
//   n     its number on the worksheet, so he can match it up
//   skill what it practises (for the progress sheet)
//   q     the problem, word for word
//   a     the answer, written the way the worksheet wants it
//   wrong three wrong answers built from common mistakes (multiple choice), or
//   typed true instead, for answers he can type: digits, a decimal point and / only
//   why   a short explanation
// Keep apostrophes out of the title: the progress sheet matches worksheets by it.
export const HOMEWORK = {
  title: '',
  problems: [],
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
  // skipping problems he's already got right on the first try (unless he has them all).
  next() {
    const list = this.homework.problems;
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
      typed: !!item.typed, why: item.why, graph: item.graph,
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
