// ARCHIVED question sets: not on the menu right now, but kept so they can be brought back.
// To restore the old Preseason: in levels.js, import ARCHIVED_PRESEASON from './archive.js'
// and add the LEVELS entry below back into the list (e.g. above the current Preseason).
//
//   {
//     id: 'archived-preseason',
//     name: 'Old Preseason',
//     icon: '⚽',
//     color: '#66bb6a',
//     desc: 'Place value, decimals, rounding, powers of 10, scaling, patterns, shapes, coordinate plane',
//     questions: ARCHIVED_PRESEASON,
//   },

// Archived "Preseason" (was the first menu option, internally REGULAR_SEASON): place value, decimals, scaling, patterns, shapes and the coordinate plane
export const ARCHIVED_PRESEASON = {
  name: 'Archived Preseason',
  blurb: 'Place value, decimals, scaling, patterns, shapes and the coordinate plane',
  easy: [
    { skill: 'Place value', q: 'In 5.382, what is the value of the 8?', a: '8 hundredths (0.08)', wrong: ['8 tenths (0.8)', '8 thousandths (0.008)', '8 ones (8)'], why: '5 is ones, 3 is tenths, 8 is hundredths, 2 is thousandths.' },
    { skill: 'Comparing decimals', q: 'Which number is the greatest?', a: '0.5', wrong: ['0.45', '0.405', '0.054'], why: '0.5 = 0.500, which beats 0.450 and 0.405.' },
    { skill: 'Rounding decimals', q: 'Round 3.46 to the nearest tenth.', a: '3.5', wrong: ['3.4', '3', '4'], why: 'The hundredths digit is 6 (5 or more), so the tenths digit rounds up.' },
    { skill: 'Powers of 10', q: 'What is 10³?', a: '1,000', wrong: ['30', '100', '10,000'], why: '10³ = 10 × 10 × 10 = 1,000. The little 3 means three 10s multiplied.' },
    { skill: 'Coordinate plane', q: 'To plot the point (3, 5), start at the origin and…', a: 'go right 3, then up 5', wrong: ['go up 3, then right 5', 'go right 5, then up 3', 'go left 3, then down 5'], why: 'The first number (x) is how far across. The second (y) is how far up.' },
    { skill: 'Coordinate plane', q: 'Where do the x-axis and the y-axis meet?', a: 'At the origin, (0, 0)', wrong: ['At (1, 1)', 'At (0, 10)', 'At the top of the grid'], why: 'The origin is the starting point (0, 0), where both axes cross.' },
    { skill: 'Classifying shapes', q: 'Which shape is ALWAYS a rectangle?', a: 'Square', wrong: ['Rhombus', 'Trapezoid', 'Parallelogram'], why: 'A square has 4 right angles, so it is a special kind of rectangle.' },
    { skill: 'Patterns', q: 'What comes next? 3, 7, 11, 15, …', a: '19', wrong: ['18', '20', '21'], why: 'The rule is "add 4": 15 + 4 = 19.' },
    { skill: 'Scaling (multiplying by fractions)', q: 'Without multiplying: 5 × 3/4 is…', a: 'less than 5', wrong: ['exactly 5', 'more than 5', 'less than 3/4'], why: 'Multiplying by a fraction less than 1 makes the number smaller.' },
    { skill: 'Reading & writing decimals', q: 'Write "three and twenty-seven hundredths" as a decimal.', a: '3.27', wrong: ['3.027', '30.27', '0.327'], why: '"And" marks the decimal point, and hundredths means two places after it.' },
  ],
  medium: [
    { skill: 'Powers of 10', q: '4.6 × 100 = ?', a: '460', wrong: ['46', '4,600', '0.046'], why: 'Multiplying by 100 moves the decimal point 2 places to the right.' },
    { skill: 'Powers of 10', q: '38.2 ÷ 10 = ?', a: '3.82', wrong: ['382', '0.382', '38.02'], why: 'Dividing by 10 moves the decimal point 1 place to the left.' },
    { skill: 'Place value', q: 'In 44.44, the 4 in the tenths place is how many times the 4 in the hundredths place?', a: '10 times', wrong: ['100 times', '1/10 as much', '4 times'], why: 'Each place is worth 10 times the place to its right. 0.4 is 10 × 0.04.' },
    { skill: 'Comparing decimals', q: 'Which list goes from least to greatest?', a: '0.07, 0.7, 0.707', wrong: ['0.7, 0.07, 0.707', '0.707, 0.7, 0.07', '0.07, 0.707, 0.7'], why: 'Compare 0.070, 0.700 and 0.707 with the same number of digits.' },
    { skill: 'Rounding decimals', q: 'Round 6.7349 to the nearest hundredth.', a: '6.73', wrong: ['6.74', '6.7', '6.735'], why: 'Look only at the thousandths digit (4). It is less than 5, so round down.' },
    { skill: 'Reading & writing decimals', q: 'What number is 2 × 10 + 5 × 1 + 3 × (1/100)?', a: '25.03', wrong: ['25.3', '2.53', '25.003'], why: '2 tens, 5 ones, 0 tenths, 3 hundredths = 25.03.' },
    { skill: 'Classifying shapes', q: 'Which shape ALWAYS has four right angles but NOT always four equal sides?', a: 'Rectangle', wrong: ['Rhombus', 'Square', 'Trapezoid'], why: 'Rectangles always have right angles, but they can be long and thin.' },
    { skill: 'Classifying shapes', q: 'Which statement is true?', a: 'Every square is a rhombus.', wrong: ['Every rhombus is a square.', 'Every rectangle is a square.', 'Every parallelogram is a rectangle.'], why: 'A rhombus has 4 equal sides. A square does too, plus right angles.' },
    { skill: 'Coordinate plane', q: 'A point sits on the x-axis, 4 units right of the origin. What is it?', a: '(4, 0)', wrong: ['(0, 4)', '(4, 4)', '(0, 0)'], why: 'Across 4, up 0. Points on the x-axis always have y = 0.' },
    { skill: 'Scaling (multiplying by fractions)', q: 'Which product is GREATER than 12?', a: '12 × 5/4', wrong: ['12 × 3/4', '12 × 1/2', '12 × 1'], why: '5/4 is more than 1, so it makes 12 bigger.' },
  ],
  hard: [
    { skill: 'Patterns', q: 'Pattern A starts at 0 and adds 3. Pattern B starts at 0 and adds 6. How do B\'s terms compare to A\'s?', a: 'Each B term is 2 times the A term', wrong: ['Each B term is 3 more than the A term', 'Each B term is half the A term', 'Each B term is 6 more than the A term'], why: 'A: 0, 3, 6, 9. B: 0, 6, 12, 18. Each B term is double.' },
    { skill: 'Patterns', q: 'Pattern A: 0, 2, 4, 6. Pattern B: 0, 6, 12, 18. Pair them up as (A, B). Which point belongs on the graph?', a: '(4, 12)', wrong: ['(4, 8)', '(12, 4)', '(6, 12)'], why: 'The third terms are 4 and 12, so the point is (4, 12).' },
    { skill: 'Powers of 10', q: '3.2 × 10⁴ = ?', a: '32,000', wrong: ['3,200', '320,000', '320'], why: '10⁴ = 10,000. Move the decimal point 4 places right.' },
    { skill: 'Comparing decimals', q: 'Which number is the greatest?', a: '0.91', wrong: ['0.9', '0.899', '0.099'], why: 'Line them up: 0.910, 0.900, 0.899, 0.099.' },
    { skill: 'Rounding decimals', q: 'Which number rounds to 7.4 (nearest tenth)?', a: '7.35', wrong: ['7.34', '7.45', '7.451'], why: '7.35 rounds up to 7.4. 7.34 rounds down to 7.3, and 7.45 rounds up to 7.5.' },
    { skill: 'Scaling (multiplying by fractions)', q: 'A 9-inch drawing is resized by a factor of 2/3. The new drawing is…', a: 'shorter than 9 inches', wrong: ['longer than 9 inches', 'still 9 inches', 'twice as long'], why: 'Scaling by a fraction less than 1 shrinks it (to 6 inches).' },
    { skill: 'Classifying shapes', q: 'What do a square, a rectangle and a rhombus all have in common?', a: 'They are all parallelograms', wrong: ['They all have four right angles', 'They all have four equal sides', 'They all have exactly one pair of parallel sides'], why: 'All three have two pairs of parallel sides.' },
    { skill: 'Coordinate plane', q: 'On a map, the school is at (2, 6) and the park is at (7, 6). How far apart are they?', a: '5 units', wrong: ['6 units', '9 units', '12 units'], why: 'Same y, so just subtract the x values: 7 − 2 = 5.' },
    { skill: 'Powers of 10', q: 'Which equals 5 × 10³?', a: '5,000', wrong: ['15', '500', '125'], why: '10³ = 1,000, and 5 × 1,000 = 5,000. (125 is 5³, a different thing!)' },
    { skill: 'Place value', q: 'In 7.777, the first 7 is worth how many times the last 7?', a: '1,000 times', wrong: ['10 times', '100 times', '3 times'], why: '7 ones vs 7 thousandths: 7 ÷ 0.007 = 1,000.' },
  ],
};
