// The four difficulty levels shown on the start menu, and which question set each one uses.
// (The set names in questions.js differ from the menu names; they're matched here by topic.)
import { REGULAR_SEASON, SEMI_FINAL, CHAMPIONSHIP } from './questions.js';

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
];
