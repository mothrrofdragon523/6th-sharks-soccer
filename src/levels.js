// The options shown on the start menu (four seasons, Times Tables and Homework), and which question set each one uses.
// (The set names in questions.js differ from the menu names; they're matched here by topic.)
import { REGULAR_SEASON, SEMI_FINAL, CHAMPIONSHIP, TIMES_TABLES } from './questions.js';
import { HOMEWORK } from './homework.js';

export const LEVELS = [
  {
    id: 'preseason',
    name: 'Preseason',
    icon: '⚽',
    color: '#66bb6a',
    desc: 'Place value, decimals, rounding, powers of 10, scaling, patterns, shapes, coordinate plane',
    questions: REGULAR_SEASON,
  },
  {
    id: 'regular',
    name: 'Regular Season',
    icon: '📅',
    color: '#42a5f5',
    desc: 'One-step problems: fractions, multi-digit multiplication, long division, plus one-step word problems',
    questions: SEMI_FINAL,
  },
  {
    id: 'playoffs',
    name: 'Playoffs',
    icon: '🔥',
    color: '#ff9800',
    desc: 'Order-of-operations word problems, reading real-world graphs, harder fractions, multiplication and division',
    questions: CHAMPIONSHIP,
  },
  {
    id: 'championship',
    name: 'Championship',
    icon: '🏆',
    color: '#fdd835',
    desc: 'A 3 Game Championship Showdown',
    // Best of 3; each game steps up to the next season's questions
    series: [REGULAR_SEASON, SEMI_FINAL, CHAMPIONSHIP],
  },
  {
    id: 'times',
    name: 'Times Tables',
    icon: '🔢',
    color: '#ab47bc',
    desc: 'Type in the facts from 3 × 3 to 12 × 12: the 3s, 4s, 5s and 10s first, then 6s–9s, then 11s and 12s, plus missing numbers from the 6s up',
    questions: TIMES_TABLES,
  },
  {
    id: 'homework',
    name: 'Homework',
    icon: '📚',
    color: '#26a69a',
    desc: HOMEWORK.problems.length
      ? `${HOMEWORK.title}: ${HOMEWORK.problems.length} problems from this week's homework, with 3 tries each`
      : 'No homework loaded yet',
    questions: HOMEWORK,
    homework: HOMEWORK,
  },
];
