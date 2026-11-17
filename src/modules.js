// Question sets built from his Module 5 and Module 6 review guides (AcadMath 6). They test the same
// skills as the guides, but with new numbers and wording. Same layout as questions.js: easy, medium and
// hard, each question with one right answer (a), three wrong ones built from common mistakes, a short
// explanation (why) and the skill it practises.
//
// Every game on these sets opens with the vocabulary review (opener): a fill-in-the-blank with a word
// bank, worded exactly as in the Module 6 review. See QuestionDeck in questions.js.

export const VOCABULARY_REVIEW = {
  skill: 'Vocabulary review',
  q: 'Complete the following to review your vocabulary for this module.',
  bank: ['circle graph', 'conversion factor', 'ratio'],
  parts: [
    { text: 'A rate in which two quantities are equal, but use different units, is called a(n) ___.', a: 'conversion factor' },
    { text: 'A graph that uses sections of a circle to compare parts to the whole and parts to other parts is called a(n) ___.', a: 'circle graph' },
    { text: 'A comparison of two quantities by division is a(n) ___.', a: 'ratio' },
  ],
  why: 'A conversion factor is a rate that equals 1 (like 12 in. per 1 ft), a circle graph shows parts of a whole, and a ratio compares two quantities by division.',
};

// Module 5: rates and ratios
export const MODULE_5 = {
  name: 'Module 5 Review',
  blurb: 'Rates and ratios: unit rates, equivalent ratios, ratio tables and graphs, and comparing numbers on the number line',
  opener: VOCABULARY_REVIEW,
  easy: [
    { skill: 'Number line', q: 'Which number is farthest to the right on a number line: −6 or −2?', a: '−2', wrong: ['−6', '6', 'They are the same'], why: 'Numbers get greater as you move right. −2 is closer to zero than −6, so it is farther right.' },
    { skill: 'Number line', q: 'Which number is farthest to the right on a number line: 5 or −8?', a: '5', wrong: ['−8', '8', '0'], why: 'Positive numbers are always to the right of negative numbers.' },
    { skill: 'Unit rates', q: 'Find the unit rate: $48 for 6 hours.', a: '$8 per hour', wrong: ['$7 per hour', '$9 per hour', '$288 per hour'], why: '48 ÷ 6 = 8 dollars for 1 hour.' },
    { skill: 'Unit rates', q: 'Find the unit rate: $27 for 3 pounds.', a: '$9 per pound', wrong: ['$3 per pound', '$24 per pound', '$81 per pound'], why: '27 ÷ 3 = 9 dollars for 1 pound.' },
    { skill: 'Equivalent ratios', q: 'Complete the equivalent ratio: 3/4 = 15/?', a: '20', wrong: ['19', '12', '60'], why: '3 × 5 = 15, so multiply the bottom by 5 too: 4 × 5 = 20.' },
    { skill: 'Equivalent ratios', q: 'Complete the equivalent ratio: 2/9 = ?/27', a: '6', wrong: ['18', '9', '7'], why: '9 × 3 = 27, so multiply the top by 3 too: 2 × 3 = 6.' },
    { skill: 'Writing ratios', q: 'Ava has 12 red beads and 20 blue beads. What is the ratio of red beads to blue beads in simplest form?', a: '3/5', wrong: ['5/3', '3/8', '12/8'], why: '12/20 divided top and bottom by 4 is 3/5. Red comes first, so red is the top number.' },
    { skill: 'Dividing fractions', q: '2/3 ÷ 1/6 = ?', a: '4', wrong: ['1/9', '1/4', '12'], why: 'How many sixths fit in 4/6? Four of them. (Or 2/3 × 6/1 = 12/3 = 4.)' },
    { skill: 'Number line', q: 'Point A is at −2.5 on a number line. Which two whole numbers is it between?', a: '−3 and −2', wrong: ['−2 and −1', '2 and 3', '−4 and −3'], why: '−2.5 is halfway between −3 and −2.' },
    { skill: 'Comparing numbers', q: 'Which symbol makes this true? −3/4 ___ −1/2', a: '<', wrong: ['>', '=', 'You can\'t tell'], why: '−3/4 is −0.75 and −1/2 is −0.5. −0.75 is farther left, so it is less.' },
  ],
  medium: [
    { skill: 'Equivalent ratios', q: 'Which ratio is equivalent to 8:20?', a: '2:5', wrong: ['4:12', '16:30', '10:22'], why: 'Divide both numbers by 4: 8 ÷ 4 = 2 and 20 ÷ 4 = 5.' },
    { skill: 'Equivalent ratios', q: 'Which ratio is NOT equivalent to 3:7?', a: '12:30', wrong: ['6:14', '9:21', '15:35'], why: '3:7 × 4 is 12:28, not 12:30. The others are 3:7 times 2, 3 and 5.' },
    { skill: 'Unit rates', q: 'A printer uses 28 ounces of ink to print 7 posters. How many ounces of ink does it use per poster?', a: '4', wrong: ['3', '5', '196'], why: '28 ÷ 7 = 4 ounces for 1 poster.' },
    { skill: 'Rate problems', q: 'A store sells 5 notebooks for $20. At the same price, how much do 9 notebooks cost?', a: '$36', wrong: ['$29', '$45', '$24'], why: 'One notebook costs 20 ÷ 5 = $4, and 9 × 4 = $36.' },
    { skill: 'Unit rates', q: 'A bakery sold 756 muffins in 6 hours. What is the unit rate in muffins per hour?', a: '126', wrong: ['116', '136', '4,536'], why: '756 ÷ 6 = 126 muffins in 1 hour.' },
    { skill: 'Dividing whole numbers', q: '350 students are going on a field trip. Each bus seats 48 students. How many buses are needed?', a: '8', wrong: ['7', '7.3', '6'], why: '350 ÷ 48 is about 7.3. Seven buses would leave students behind, so you need 8.' },
    { skill: 'Decimal unit rates', q: 'A recipe uses 12.5 cups of fruit to make 5 smoothies. How many cups of fruit are in each smoothie?', a: '2.5', wrong: ['2', '7.5', '62.5'], why: '12.5 ÷ 5 = 2.5 cups for 1 smoothie.' },
    { skill: 'Ratios and graphs', q: 'The graph shows cups of lemonade sold and the money Dev earns. When he sells 4 cups, what is the ratio of cups to dollars, as a fraction in simplest form?', a: '1/3', wrong: ['3/1', '1/4', '1/6'], why: 'At 4 cups he earns $12. 4/12 simplifies to 1/3. Cups come first, so cups are the top number.',
      graph: { x: 'Cups of lemonade sold', y: 'Money earned (dollars)', xStep: 2, yStep: 6, series: [{ points: [[2, 6], [4, 12], [6, 18], [8, 24]] }] } },
    { skill: 'Ratio tables', q: 'In a ratio table, 1 box holds 8 markers. How many markers are in 4 boxes?', a: '32', wrong: ['12', '24', '36'], why: '4 boxes × 8 markers each = 32 markers.' },
    { skill: 'Ratio tables', q: 'Pets adopted out of pets in the shelter: Dogs 6 of 8, Cats 9 of 15, Birds 12 of 16, Rabbits 5 of 10. Which two have the same ratio?', a: 'Dogs and Birds', wrong: ['Dogs and Cats', 'Cats and Rabbits', 'Birds and Rabbits'], why: '6/8 = 3/4 and 12/16 = 3/4. Cats are 3/5 and rabbits are 1/2.' },
  ],
  hard: [
    { skill: 'Rate problems', q: 'A zoo charges $96 for 8 tickets. If the cost stays the same, how much do 13 tickets cost?', a: '$156', wrong: ['$101', '$144', '$1,248'], why: 'One ticket costs 96 ÷ 8 = $12, and 13 × 12 = $156.' },
    { skill: 'Rate problems', q: 'A landscaper earns $60 for every 5 bushes planted. How many bushes must be planted to earn $420?', a: '35', wrong: ['25', '84', '7'], why: 'Each bush earns 60 ÷ 5 = $12, and 420 ÷ 12 = 35 bushes.' },
    { skill: 'Decimal rates', q: 'A machine uses 0.6 liter of paint to paint 18 signs. How many signs can it paint with 1.5 liters?', a: '45', wrong: ['30', '36', '54'], why: '18 ÷ 0.6 = 30 signs per liter, and 30 × 1.5 = 45.' },
    { skill: 'Decimal rates', q: 'A recipe uses 3.5 cups of flour to make 28 cookies. How many cookies can be made with 5.25 cups of flour?', a: '42', wrong: ['40', '8', '147'], why: '28 ÷ 3.5 = 8 cookies per cup, and 8 × 5.25 = 42.' },
    { skill: 'Comparing unit rates', q: 'Which is the faster typing speed: 360 words in 8 minutes, or 435 words in 10 minutes?', a: '360 words in 8 minutes', wrong: ['435 words in 10 minutes', 'They are equal', 'You can\'t tell'], why: '360 ÷ 8 = 45 words per minute. 435 ÷ 10 = 43.5 words per minute.' },
    { skill: 'Ratios and graphs', q: 'The graph shows nonfiction books (x) and fiction books (y) in Leo\'s collection. If Leo has 12 nonfiction books, what is the ratio of nonfiction to fiction, as a fraction in simplest form?', a: '2/5', wrong: ['5/2', '2/3', '1/3'], why: 'At 12 nonfiction books he has 30 fiction books. 12/30 simplifies to 2/5.',
      graph: { x: 'Nonfiction books', y: 'Fiction books', xStep: 4, yStep: 10, series: [{ points: [[4, 10], [8, 20], [12, 30]] }] } },
    { skill: 'Ratio tables', q: 'In a ratio table, 1 box holds 8 markers. How many boxes hold 56 markers?', a: '7', wrong: ['48', '8', '448'], why: '56 ÷ 8 = 7 boxes.' },
    { skill: 'Rate problems', q: 'Jada earns $45 for every 3 cars she washes. She wants a video game that costs $330. How many cars must she wash?', a: '22', wrong: ['8', '11', '25'], why: 'Each car earns 45 ÷ 3 = $15, and 330 ÷ 15 = 22 cars.' },
    { skill: 'Number line', q: 'Which list is in order from least to greatest?', a: '−4.5, −2, −1/2, 3', wrong: ['−1/2, −2, −4.5, 3', '3, −1/2, −2, −4.5', '−2, −4.5, −1/2, 3'], why: 'On a number line the farthest left is least: −4.5, then −2, then −1/2, then 3.' },
    { skill: 'Comparing unit rates', q: 'Store A sells 5 pounds of apples for $12.50. Store B sells 8 pounds for $18. Which store has the lower price per pound?', a: 'Store B, $2.25 per pound', wrong: ['Store A, $2.50 per pound', 'Store A, $2.25 per pound', 'They cost the same'], why: '12.50 ÷ 5 = $2.50 per pound at Store A, and 18 ÷ 8 = $2.25 per pound at Store B.' },
  ],
};

// Module 6: ratios and rates in measurement
export const MODULE_6 = {
  name: 'Module 6 Review',
  blurb: 'Converting customary and metric units, comparing measurements, circle graphs and ratios',
  opener: VOCABULARY_REVIEW,
  easy: [
    { skill: 'Converting units', q: 'How many ounces are in 3 pounds? (1 lb = 16 oz)', a: '48', wrong: ['36', '19', '160'], why: '3 × 16 = 48 ounces.' },
    { skill: 'Converting units', q: 'How many inches are in 5 feet? (1 ft = 12 in.)', a: '60', wrong: ['50', '17', '12'], why: '5 × 12 = 60 inches.' },
    { skill: 'Circles', q: 'A wheel turns one complete rotation. How many degrees does it turn?', a: '360°', wrong: ['180°', '90°', '100°'], why: 'A full circle is 360 degrees.' },
    { skill: 'Circles', q: 'How many degrees are in a half-circle?', a: '180°', wrong: ['90°', '360°', '120°'], why: 'Half of 360° is 180°.' },
    { skill: 'Writing ratios', q: 'A bag has 12 red marbles and 16 blue marbles. Write the ratio of red to blue as a fraction in simplest form.', a: '3/4', wrong: ['4/3', '3/7', '1/4'], why: '12/16 divided top and bottom by 4 is 3/4.' },
    { skill: 'Comparing decimals', q: 'Which symbol makes this true? −0.7 ___ −1.3', a: '>', wrong: ['<', '=', 'You can\'t tell'], why: '−0.7 is closer to zero, so it is to the right of −1.3 on the number line. That makes it greater.' },
    { skill: 'Dividing mixed numbers', q: '3 1/2 ÷ 7 = ?', a: '1/2', wrong: ['2', '24 1/2', '1 1/2'], why: '3 1/2 is 7/2. 7/2 ÷ 7 = 7/2 × 1/7 = 1/2.' },
    { skill: 'Converting units', q: 'How many centimeters are in 3 meters? (1 m = 100 cm)', a: '300', wrong: ['30', '3,000', '0.03'], why: '3 × 100 = 300 centimeters.' },
    { skill: 'Converting units', q: 'How many kilograms are in 4,000 grams? (1 kg = 1,000 g)', a: '4', wrong: ['0.4', '40', '4,000,000'], why: '4,000 ÷ 1,000 = 4 kilograms.' },
    { skill: 'Converting units', q: 'How many feet are in 2 yards? (1 yd = 3 ft)', a: '6', wrong: ['24', '72', '12'], why: '2 × 3 = 6 feet.' },
  ],
  medium: [
    { skill: 'Converting units', q: 'How many feet are in 4.5 yards? (1 yd = 3 ft)', a: '13.5', wrong: ['1.5', '54', '16.5'], why: '4.5 × 3 = 13.5 feet.' },
    { skill: 'Converting units', q: 'A package weighs 18 kilograms. About how many pounds is that? (1 kg ≈ 2.2 lb)', a: '39.6 pounds', wrong: ['8.2 pounds', '20.2 pounds', '396 pounds'], why: 'Kilograms to pounds: multiply by 2.2. 18 × 2.2 = 39.6.' },
    { skill: 'Converting units', q: 'A gym has 330 pounds of weights. About how many kilograms is that? (1 kg ≈ 2.2 lb)', a: '150 kilograms', wrong: ['726 kilograms', '332.2 kilograms', '15 kilograms'], why: 'Pounds to kilograms: divide by 2.2. 330 ÷ 2.2 = 150.' },
    { skill: 'Converting capacity', q: 'A tank holds 3 1/2 gallons of water. How many fluid ounces is that? (1 gal = 128 fl oz)', a: '448', wrong: ['28', '112', '3,584'], why: '3.5 × 128 = 448 fluid ounces.' },
    { skill: 'Converting capacity', q: 'A cooler holds 640 fluid ounces of lemonade. How many gallons is that? (1 gal = 128 fl oz)', a: '5', wrong: ['80', '20', '5,120'], why: '640 ÷ 128 = 5 gallons.' },
    { skill: 'Converting units', q: 'A ribbon is 75 centimeters long. How many millimeters long is it? (1 cm = 10 mm)', a: '750', wrong: ['7.5', '7,500', '0.75'], why: '75 × 10 = 750 millimeters.' },
    { skill: 'Converting units', q: 'A bracelet chain is 360 millimeters long. How many centimeters is that? (1 cm = 10 mm)', a: '36', wrong: ['3.6', '3,600', '360,000'], why: '360 ÷ 10 = 36 centimeters.' },
    { skill: 'Comparing measurements', q: 'Which symbol makes this true? 2.5 km ___ 2,400 m', a: '>', wrong: ['<', '=', 'You can\'t tell'], why: '2.5 km = 2,500 m, which is more than 2,400 m.' },
    { skill: 'Comparing measurements', q: 'Which symbol makes this true? 8,200 mg ___ 8.2 g', a: '=', wrong: ['<', '>', 'You can\'t tell'], why: '1 g = 1,000 mg, so 8.2 g = 8,200 mg.' },
    { skill: 'Circle graphs', q: 'In a survey of 72 students, 18 chose soccer as their favorite sport. In a circle graph, what is the angle measure of the soccer section?', a: '90°', wrong: ['25°', '180°', '18°'], why: '18/72 = 1/4 of the students, and 1/4 of 360° is 90°.' },
  ],
  hard: [
    { skill: 'Comparing measurements', q: 'A hallway is 30 feet long and a rug is 8 meters long. Which is longer, and by how much? (1 m ≈ 3.28 ft)', a: 'The hallway, by about 3.76 feet', wrong: ['The rug, by about 3.76 feet', 'The hallway, by about 22 feet', 'The rug, by about 22 feet'], why: '8 m ≈ 8 × 3.28 = 26.24 feet. The hallway is longer: 30 − 26.24 = 3.76 feet.' },
    { skill: 'Comparing measurements', q: 'A toy car is 240 millimeters long and a toy plane is 21 centimeters long. Which is longer, and by how much?', a: 'The car, by 30 mm', wrong: ['The plane, by 30 mm', 'The car, by 3 mm', 'The plane, by 219 mm'], why: '21 cm = 210 mm. The car is longer: 240 − 210 = 30 mm.' },
    { skill: 'Comparing measurements', q: 'A bottle holds 1.4 liters and a container holds 1,250 milliliters. Which holds more, and by how much?', a: 'The bottle, by 150 mL', wrong: ['The container, by 150 mL', 'The bottle, by 15 mL', 'The bottle, by 0.15 mL'], why: '1.4 L = 1,400 mL. The bottle holds more: 1,400 − 1,250 = 150 mL.' },
    { skill: 'Conversion word problems', q: 'A site gets 900 kilograms of gravel, sold in 50-pound bags. About how many full bags can be made? (1 kg ≈ 2.2 lb)', a: '39', wrong: ['18', '8', '45'], why: '900 kg ≈ 900 × 2.2 = 1,980 pounds. 1,980 ÷ 50 = 39.6, so 39 full bags.' },
    { skill: 'Conversion word problems', q: 'A dispenser holds 6 gallons of juice. Paper cups hold 12 fluid ounces each. How many full cups can be filled? (1 gal = 128 fl oz)', a: '64', wrong: ['32', '72', '768'], why: '6 × 128 = 768 fluid ounces. 768 ÷ 12 = 64 cups.' },
    { skill: 'Ordering capacity', q: 'Which list goes from LEAST to GREATEST capacity?', a: '2 quarts, 9 cups, 5 pints, 1 gallon', wrong: ['9 cups, 2 quarts, 5 pints, 1 gallon', '1 gallon, 5 pints, 9 cups, 2 quarts', '2 quarts, 5 pints, 9 cups, 1 gallon'], why: 'In fluid ounces: 2 quarts = 64, 9 cups = 72, 5 pints = 80 and 1 gallon = 128.' },
    { skill: 'Circle graphs', q: 'A punch recipe uses 40 oz cranberry juice, 30 oz orange juice, 20 oz pineapple juice and 10 oz ginger ale. In a circle graph, what is the angle for cranberry juice?', a: '144°', wrong: ['40°', '100°', '90°'], why: 'The recipe is 100 oz in all. 40/100 of 360° = 144°.' },
    { skill: 'Circle graphs', q: 'In a circle graph of 300 sixth graders\' favorite sports, the soccer section is 72°. How many students chose soccer?', a: '60', wrong: ['72', '20', '216'], why: '72/360 = 1/5 of the circle, and 1/5 of 300 is 60.' },
    { skill: 'Conversion factors', q: 'Which conversion factor changes inches to centimeters?', a: '2.54 cm / 1 in.', wrong: ['1 cm / 2.54 in.', '2.54 in. / 1 cm', '1 in. / 2.54 cm'], why: 'Put the unit you want (centimeters) on top and the unit you start with (inches) on the bottom, so the inches cancel.' },
    { skill: 'Conversion word problems', q: 'A cheetah runs 112 kilometers per hour. A kilometer is about 5/8 mile. About how many miles per hour is that?', a: '70 miles per hour', wrong: ['179 miles per hour', '78 miles per hour', '700 miles per hour'], why: '112 × 5/8 = 560/8 = 70.' },
  ],
};

// Both modules together: the last game of the Championship.
export const MODULES_5_AND_6 = {
  name: 'Modules 5 & 6 Review',
  blurb: 'Rates and ratios, and measurement, all together',
  opener: VOCABULARY_REVIEW,
  easy: [...MODULE_5.easy, ...MODULE_6.easy],
  medium: [...MODULE_5.medium, ...MODULE_6.medium],
  hard: [...MODULE_5.hard, ...MODULE_6.hard],
};
