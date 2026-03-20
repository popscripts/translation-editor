export function flattenJSON(
  input: Record<string, unknown>,
  parentKey = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flattenJSON(value as Record<string, unknown>, nextKey));
    } else {
      result[nextKey] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }

  return result;
}

export function unflattenJSON(input: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [flatKey, value] of Object.entries(input)) {
    const parts = flatKey.split(".");
    let cursor: Record<string, unknown> = result;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        cursor[part] = value;
      } else {
        if (!cursor[part] || typeof cursor[part] !== "object") {
          cursor[part] = {};
        }
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }

  return result;
}

export function getKeyGroup(key: string): string {
  const [first] = key.split(".");
  return first || "other";
}

export type Segment =
  | { type: "text"; value: string }
  | { type: "variable"; value: string }
  | { type: "highlight_open"; value: "<highlight>" }
  | { type: "highlight_close"; value: "</highlight>" };

const tokenRegex = /(\{[^}]+\}|<highlight>|<\/highlight>)/g;

export function parseTranslationSegments(text: string): Segment[] {
  const tokens = text.split(tokenRegex).filter(Boolean);

  return tokens.map((token) => {
    if (token === "<highlight>") {
      return { type: "highlight_open", value: token };
    }
    if (token === "</highlight>") {
      return { type: "highlight_close", value: token };
    }
    if (/^\{[^}]+\}$/.test(token)) {
      return { type: "variable", value: token };
    }
    return { type: "text", value: token };
  });
}
