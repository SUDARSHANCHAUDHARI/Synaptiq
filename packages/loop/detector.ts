export function detectLoop(history: string[], current: string) {
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ");

  const currentTokens = new Set(normalize(current).split(" ").filter(Boolean));
  if (currentTokens.size === 0) {
    return false;
  }

  return history.some((entry) => {
    const previousTokens = new Set(normalize(entry).split(" ").filter(Boolean));
    if (previousTokens.size === 0) {
      return false;
    }

    let overlap = 0;
    for (const token of currentTokens) {
      if (previousTokens.has(token)) {
        overlap += 1;
      }
    }

    const similarity = overlap / Math.max(currentTokens.size, previousTokens.size);
    return similarity >= 0.85;
  });
}
