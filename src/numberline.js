// Subtraction help: when he misses a question with a whole-number subtraction in it (in the
// question, or a step in the explanation), show it on a number line. He subtracts by counting
// up, but counts the numbers ("9, 10, 11, 12" = 4) instead of the jumps (3), and can lose track
// that he's subtracting. So the line starts at the smaller number and numbers each jump.

// The first "12 − 9 = 3" style subtraction in the text, as { big, small }, or null.
// Skips fractions and decimals ("7/8 − 2/8", "4.5 − 2") and anything that doesn't add up.
export function findSubtraction(...texts) {
  for (const text of texts) {
    const re = /(?<![\d/.,])(\d+) − (\d+)(?: = (\d+|\?))?(?![\d/]|[.,]\d)/g;
    for (const m of String(text || '').matchAll(re)) {
      const big = +m[1], small = +m[2];
      if (small >= big || big - small > 100) continue;
      if (m[3] && m[3] !== '?' && +m[3] !== big - small) continue; // "12 − 4 − 3 = 5" is two steps
      if (!m[3] && !String(text).slice(m.index).startsWith(`${m[0]})`)) continue; // bare "a − b" only inside ( )
      return { big, small };
    }
  }
  return null;
}

// The jumps from small up to big: single steps when it's 12 or less, otherwise friendly
// jumps (up to the next ten, then tens, then the rest).
function jumps(small, big) {
  const out = [];
  if (big - small <= 12) {
    for (let n = small; n < big; n++) out.push([n, n + 1]);
    return out;
  }
  let n = small;
  const ten = Math.ceil(n / 10) * 10;
  if (ten > n && ten < big) { out.push([n, ten]); n = ten; }
  while (n + 10 <= big) { out.push([n, n + 10]); n += 10; }
  if (n < big) out.push([n, big]);
  return out;
}

// { svg, caption } for the number line, ready to put on the question card.
export function numberLine({ big, small }) {
  const diff = big - small;
  const steps = jumps(small, big);
  const single = diff <= 12;
  const W = 440, H = 112, padL = 30, padR = 30, axisY = 82;
  const x = n => padL + ((n - small) / diff) * (W - padL - padR);
  const marks = single ? Array.from({ length: diff + 1 }, (_, i) => small + i) : [small, ...steps.map(s => s[1])];

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line from ${small} to ${big}">`;
  svg += `<line x1="${padL - 14}" y1="${axisY}" x2="${W - padR + 14}" y2="${axisY}" stroke="#333" stroke-width="2"/>`;
  for (const n of marks) {
    const start = n === small, end = n === big;
    svg += `<line x1="${x(n)}" y1="${axisY - 7}" x2="${x(n)}" y2="${axisY + 7}" stroke="#333" stroke-width="2"/>`;
    svg += `<text x="${x(n)}" y="${axisY + 24}" text-anchor="middle" font-size="15" font-weight="${start || end ? 'bold' : 'normal'}" fill="${start ? '#1565c0' : end ? '#2e7d32' : '#333'}">${n}</text>`;
  }
  steps.forEach(([from, to], i) => {
    const x1 = x(from), x2 = x(to), mid = (x1 + x2) / 2, lift = Math.min(34, 12 + (x2 - x1) / 3);
    svg += `<path d="M${x1} ${axisY - 8} Q${mid} ${axisY - 8 - lift * 2} ${x2} ${axisY - 8}" fill="none" stroke="#fb8c00" stroke-width="2.5"/>`;
    svg += `<polygon points="${x2} ${axisY - 7},${x2 - 7} ${axisY - 14},${x2 - 1} ${axisY - 17}" fill="#fb8c00"/>`;
    svg += `<text x="${mid}" y="${axisY - 12 - lift}" text-anchor="middle" font-size="14" font-weight="bold" fill="#e65100">${single ? i + 1 : `+${to - from}`}</text>`;
  });
  svg += '</svg>';

  const caption = single
    ? `${big} − ${small}: start at ${small} and count the jumps, not the numbers. ${diff} ${diff === 1 ? 'jump' : 'jumps'}, so ${big} − ${small} = ${diff}. Or think: ${small} + what = ${big}?`
    : `${big} − ${small}: start at ${small} and jump to ${big}. ${steps.map(([f, t]) => t - f).join(' + ')} = ${diff}, so ${big} − ${small} = ${diff}.`;
  return { svg, caption };
}
