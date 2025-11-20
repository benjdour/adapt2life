type OpenRouterToolCall = {
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type OpenRouterChoice = {
  message?: {
    content?: unknown;
    function_call?: {
      arguments?: string;
    };
    tool_calls?: OpenRouterToolCall[];
  };
};

export type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

const flattenContent = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenContent(item));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const segments: string[] = [];
    if (typeof record.text === "string") {
      segments.push(record.text);
    }
    if (typeof record.content === "string") {
      segments.push(record.content);
    }
    if (Array.isArray(record.content)) {
      segments.push(...flattenContent(record.content));
    }
    if (Array.isArray(record.parts)) {
      segments.push(...flattenContent(record.parts));
    }
    if (Array.isArray(record.messages)) {
      segments.push(...flattenContent(record.messages));
    }
    if (typeof record.json === "object" && record.json !== null) {
      try {
        const serialized = JSON.stringify(record.json);
        if (serialized) {
          segments.push(serialized);
        }
      } catch {
        // ignore serialization issues
      }
    }
    return segments;
  }
  return [];
};

export const extractMessageText = (choice: OpenRouterChoice | undefined): string | null => {
  if (!choice?.message) {
    return null;
  }

  const segments: string[] = [];

  const pushContent = (value: unknown) => {
    const flattened = flattenContent(value)
      .map((segment) => segment.trim())
      .filter(Boolean);
    segments.push(...flattened);
  };

  pushContent(choice.message.content);

  const functionArgs = choice.message.function_call?.arguments;
  if (typeof functionArgs === "string" && functionArgs.trim()) {
    segments.push(functionArgs.trim());
  }

  if (Array.isArray(choice.message.tool_calls)) {
    for (const call of choice.message.tool_calls) {
      const args = call.function?.arguments;
      if (typeof args === "string" && args.trim()) {
        segments.push(args.trim());
      }
    }
  }

  return segments.length > 0 ? segments.join("\n\n") : null;
};

export type { OpenRouterToolCall };
