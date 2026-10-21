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
//   notebook true for written answers he writes in his notebook (like science questions): the
//         game shows the question and an "I wrote it" button, and counts it as right. a is an
//         example answer for the answer key only; the game doesn't show it.
//   paper  true for a problem the pad can't check (like "describe the pattern"): it isn't asked
//         in the game, but its example answer is in the answers list at the end
//   why   a short explanation
// A problem that asks two things is split in two (2B-1, 2B-2), so each has one answer.
// Keep apostrophes out of the title: the progress sheet matches worksheets by it.
export const HOMEWORK = {
  title: 'Science Earth Moon and Solar System',
  problems: [
    { n: '14', notebook: true, skill: 'Day and night', q: 'Why can it be daytime in North America while it is nighttime in parts of Asia? Use the words rotation, Sun, and Earth in your explanation.',
      a: 'Earth\'s rotation turns one side of Earth toward the Sun (day) while the other side faces away (night). North America and Asia are on opposite sides.' },
    { n: '15', notebook: true, skill: 'Orbits', q: 'What shape best describes the path the Moon follows around the Earth? Is the Earth exactly at the center of that path?',
      a: 'An ellipse (a slightly stretched circle). No, Earth is a little off-center.' },
    { n: '16', notebook: true, skill: 'Orbits', q: 'Why can a planet be slightly closer to the Sun at some points in its orbit than at others?',
      a: 'Its orbit is an ellipse, not a perfect circle, and the Sun is a little off-center, so the distance changes as it goes around.' },
    { n: '17', notebook: true, skill: 'Orbits', q: 'Neptune is farther from the Sun than Earth. Compare the size of Neptune\'s orbit and the time it takes Neptune to complete one revolution with Earth\'s.',
      a: 'Neptune\'s orbit is much bigger, so one trip around the Sun takes much longer (about 165 Earth years, compared with 1 year for Earth).' },
    { n: '18', notebook: true, skill: 'Gravity', q: 'What is gravity? Explain how Earth\'s gravity helps keep the Moon in orbit around Earth.',
      a: 'Gravity is the force that pulls objects toward each other. Earth\'s gravity keeps pulling the Moon toward it while the Moon moves forward, so the Moon keeps curving around Earth instead of flying off.' },
    { n: '19', notebook: true, skill: 'Solar system formation', q: 'In your own words, describe the main steps scientists think led to the formation of our solar system. Use your class materials to help you put the steps in order.',
      a: 'A cloud of gas and dust → gravity pulled it together and it spun into a flat disk → the center got hot and dense and became the Sun → leftover material clumped into planets, moons, asteroids and comets.' },
    // Check Your Understanding
    { n: '20', notebook: true, skill: 'Moon phases and eclipses', q: 'Explain the difference between a Moon phase and an eclipse.',
      a: 'A phase is how much of the Moon\'s sunlit side we see, and it changes every night. An eclipse is when Earth or the Moon blocks sunlight, and it only happens now and then when the Sun, Earth and Moon line up.' },
    { n: '21', notebook: true, skill: 'Moonlight', q: 'Why do we see the Moon even though it does not produce its own light?',
      a: 'It reflects light from the Sun.' },
    { n: '22', notebook: true, skill: 'Moon phases', q: 'What stays the same, and what changes, as the Moon moves through its phases?',
      a: 'The same: the Moon itself, and half of it is always lit by the Sun. Changes: how much of the lit half we can see from Earth.' },
    { n: '23', notebook: true, skill: 'Eclipses', q: 'What are two important differences between a solar eclipse and a lunar eclipse?',
      a: 'Solar: the Moon passes between the Sun and Earth, blocking the Sun, during a new Moon. Lunar: Earth passes between the Sun and Moon, its shadow covers the Moon, during a full Moon.' },
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
