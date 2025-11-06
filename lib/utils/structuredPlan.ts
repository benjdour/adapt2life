export type ParsedPlanMarkdown = {
  humanMarkdown: string;
  structuredPlanJson: string | null;
};

const STRUCTURED_SECTION_REGEX = /###\s*🗂️\s*Plan structuré\s*```json\s*([\s\S]*?)```/i;

export const splitPlanMarkdown = (input: string): ParsedPlanMarkdown => {
  if (typeof input !== "string") {
    return {
      humanMarkdown: "",
      structuredPlanJson: null,
    };
  }

  const match = input.match(STRUCTURED_SECTION_REGEX);

  if (!match) {
    return {
      humanMarkdown: input.trim(),
      structuredPlanJson: null,
    };
  }

  const [matchedBlock, jsonContent] = match;

  const before = input.slice(0, match.index);
  const after = input.slice(match.index + matchedBlock.length);

  const humanMarkdown = `${before}${after}`.trim();
  const structuredPlanJson = jsonContent.trim();

  return {
    humanMarkdown,
    structuredPlanJson: structuredPlanJson.length > 0 ? structuredPlanJson : null,
  };
};

export const parseStructuredPlanJson = <T = unknown>(json: string | null): T | null => {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};
