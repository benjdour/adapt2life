export const unwrapJsonCodeBlock = (input: string): string => {
  if (!input) {
    return input;
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith("```") || trimmed.length < 6) {
    return input;
  }

  const firstLineBreak = trimmed.indexOf("\n");
  if (firstLineBreak === -1) {
    return input;
  }

  const fenceHeader = trimmed.slice(3, firstLineBreak).trim().toLowerCase();
  if (fenceHeader && fenceHeader !== "json") {
    return input;
  }

  const closingFenceIndex = trimmed.lastIndexOf("```\n");
  const closingBackticksIndex = closingFenceIndex === -1 ? trimmed.lastIndexOf("```") : closingFenceIndex;
  if (closingBackticksIndex <= firstLineBreak) {
    return input;
  }

  return trimmed.slice(firstLineBreak + 1, closingBackticksIndex).trim();
};

export const parseJsonWithCodeFence = (raw: string): { parsed: unknown; source: string } | null => {
  const attempts = [raw, unwrapJsonCodeBlock(raw)];
  for (const candidate of attempts) {
    if (!candidate || !candidate.trim()) {
      continue;
    }
    try {
      const parsed = JSON.parse(candidate);
      return { parsed, source: candidate };
    } catch {
      // try next
    }
  }
  return null;
};
