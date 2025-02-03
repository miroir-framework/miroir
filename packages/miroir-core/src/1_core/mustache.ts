interface PatternMatch {
  content: string;
  start: number;
  end: number;
}

export function extractDoubleBracePatterns(input: string): PatternMatch[] {
  const regex = /{{\s*([^}]+?)\s*}}/g;
  const matches: PatternMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const content = match[1].trim(); // content inside the double braces
    if (content === '') {
      throw new Error('Empty pattern found');
    }
    const start = match.index; // index of first char in the match
    const end = start + match[0].length - 1; // index of last char in the match
    matches.push({ content, start, end });
  }

  return matches;
}