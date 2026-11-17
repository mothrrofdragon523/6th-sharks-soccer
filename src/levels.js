// The options shown on the start menu (Preseason, Regular Season, Playoffs, Championship, Times Tables and Homework; the old Preseason is archived in archive.js), and which question set each one uses.
// (The set names in questions.js differ from the menu names; they're matched here by topic.)
import { FIFTH_GRADE_REVIEW, TIMES_TABLES } from './questions.js';
import { MODULE_5, MODULE_6, MODULES_5_AND_6 } from './modules.js';
import { HOMEWORK } from './homework.js';

export const LEVELS = [
  {
    id: 'preseason',
    name: 'Preseason',
    icon: '⚽',
    color: '#66bb6a',
    desc: '5th Grade Review',
    questions: FIFTH_GRADE_REVIEW,
  },
  {
    id: 'regular',
    name: 'Regular Season',
    icon: '📅',
    color: '#42a5f5',
    desc: 'Module 5 Review: unit rates, equivalent ratios, ratio tables and graphs, comparing numbers on the number line',
    questions: MODULE_5,
  },
  {
    id: 'playoffs',
    name: 'Playoffs',
    icon: '🔥',
    color: '#ff9800',
    desc: 'Module 6 Review: converting customary and metric units, comparing measurements, circle graphs, ratios',
    questions: MODULE_6,
  },
  {
    id: 'championship',
    name: 'Championship',
    icon: '🏆',
    color: '#fdd835',
    desc: 'A 3 Game Championship Showdown',
    // Best of 3: Module 5, then Module 6, then both together
    series: [MODULE_5, MODULE_6, MODULES_5_AND_6],
  },
  {
    id: 'times',
    name: 'Times Tables',
    icon: '🔢',
    color: '#ab47bc',
    desc: 'Fill in the blanks on the 7s, 9s, 11s and 12s: close shots get the 7s and 9s, longer shots the 11s and 12s, and long-range shots a mix of all four',
    questions: TIMES_TABLES,
  },
  {
    id: 'homework',
    name: 'Homework',
    icon: '📚',
    color: '#26a69a',
    desc: !HOMEWORK.problems.length ? 'No homework loaded yet'
      : HOMEWORK.problems.every(p => p.notebook || p.paper)
        ? `${HOMEWORK.title}: answer each question in your notebook, then take your shot`
        : `${HOMEWORK.title}: fill in the answers to this week's homework, with 2 tries each`,
    questions: HOMEWORK,
    homework: HOMEWORK,
  },
];
