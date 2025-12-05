const LINES_PER_PAGE = 39;
const MAX_LINE_WIDTH = 88;

const WIN_ANSI_TUPLES: Array<[string, number]> = [
  ["\u20AC", 128],
  ["\u201A", 130],
  ["\u0192", 131],
  ["\u201E", 132],
  ["\u2026", 133],
  ["\u2020", 134],
  ["\u2021", 135],
  ["\u02C6", 136],
  ["\u2030", 137],
  ["\u0160", 138],
  ["\u2039", 139],
  ["\u0152", 140],
  ["\u017D", 142],
  ["\u2018", 145],
  ["\u2019", 146],
  ["\u201C", 147],
  ["\u201D", 148],
  ["\u2022", 149],
  ["\u2013", 150],
  ["\u2014", 151],
  ["\u02DC", 152],
  ["\u2122", 153],
  ["\u0161", 154],
  ["\u203A", 155],
  ["\u0153", 156],
  ["\u017E", 158],
  ["\u0178", 159],
  ["\u00A1", 161],
  ["\u00A2", 162],
  ["\u00A3", 163],
  ["\u00A4", 164],
  ["\u00A5", 165],
  ["\u00A6", 166],
  ["\u00A7", 167],
  ["\u00A8", 168],
  ["\u00A9", 169],
  ["\u00AA", 170],
  ["\u00AB", 171],
  ["\u00AC", 172],
  ["\u00AE", 174],
  ["\u00AF", 175],
  ["\u00B0", 176],
  ["\u00B1", 177],
  ["\u00B2", 178],
  ["\u00B3", 179],
  ["\u00B4", 180],
  ["\u00B5", 181],
  ["\u00B6", 182],
  ["\u00B7", 183],
  ["\u00B8", 184],
  ["\u00B9", 185],
  ["\u00BA", 186],
  ["\u00BB", 187],
  ["\u00BC", 188],
  ["\u00BD", 189],
  ["\u00BE", 190],
  ["\u00BF", 191],
  ["\u00C0", 192],
  ["\u00C1", 193],
  ["\u00C2", 194],
  ["\u00C3", 195],
  ["\u00C4", 196],
  ["\u00C5", 197],
  ["\u00C6", 198],
  ["\u00C7", 199],
  ["\u00C8", 200],
  ["\u00C9", 201],
  ["\u00CA", 202],
  ["\u00CB", 203],
  ["\u00CC", 204],
  ["\u00CD", 205],
  ["\u00CE", 206],
  ["\u00CF", 207],
  ["\u00D0", 208],
  ["\u00D1", 209],
  ["\u00D2", 210],
  ["\u00D3", 211],
  ["\u00D4", 212],
  ["\u00D5", 213],
  ["\u00D6", 214],
  ["\u00D8", 216],
  ["\u00D9", 217],
  ["\u00DA", 218],
  ["\u00DB", 219],
  ["\u00DC", 220],
  ["\u00DD", 221],
  ["\u00DE", 222],
  ["\u00DF", 223],
  ["\u00E0", 224],
  ["\u00E1", 225],
  ["\u00E2", 226],
  ["\u00E3", 227],
  ["\u00E4", 228],
  ["\u00E5", 229],
  ["\u00E6", 230],
  ["\u00E7", 231],
  ["\u00E8", 232],
  ["\u00E9", 233],
  ["\u00EA", 234],
  ["\u00EB", 235],
  ["\u00EC", 236],
  ["\u00ED", 237],
  ["\u00EE", 238],
  ["\u00EF", 239],
  ["\u00F0", 240],
  ["\u00F1", 241],
  ["\u00F2", 242],
  ["\u00F3", 243],
  ["\u00F4", 244],
  ["\u00F5", 245],
  ["\u00F6", 246],
  ["\u00F8", 248],
  ["\u00F9", 249],
  ["\u00FA", 250],
  ["\u00FB", 251],
  ["\u00FC", 252],
  ["\u00FD", 253],
  ["\u00FE", 254],
  ["\u00FF", 255],
];

const WIN_ANSI_OVERRIDES = WIN_ANSI_TUPLES.reduce<Record<string, number>>((acc, [char, code]) => {
  acc[char] = code;
  return acc;
}, {});

const stripInlineFormatting = (value: string) => value.replace(/(\*\*|__)/g, "");

const normalizeRepetitionCount = (value: string) =>
  value.replace(/\b(\d+)\s*x\s*(\d+)/gi, (match, count, distance) => `${count}x${distance}`);

const stripLeadingSymbols = (value: string) => {
  const cleaned = normalizeRepetitionCount(stripInlineFormatting(value));
  return cleaned.replace(/^[^0-9A-Za-zÀ-ÿ]+/u, "").trimStart();
};

const wrapParagraph = (
  text: string,
  options: { maxWidth?: number; firstLineIndent?: string; subsequentIndent?: string } = {},
): string[] => {
  const { maxWidth = MAX_LINE_WIDTH, firstLineIndent = "", subsequentIndent = firstLineIndent } = options;
  const normalizedWords = text.split(/\s+/).filter(Boolean);
  if (normalizedWords.length === 0) {
    return [" "];
  }

  const lines: string[] = [];
  let currentLine = firstLineIndent;

  const pushLine = () => {
    if (currentLine.length === 0) {
      lines.push(" ");
    } else {
      lines.push(currentLine.trimEnd());
    }
  };

  for (const word of normalizedWords) {
    const needsSpace = currentLine.length > 0 && !currentLine.endsWith(" ");
    const candidate = currentLine.length === 0 ? `${firstLineIndent}${word}` : `${currentLine}${needsSpace ? " " : ""}${word}`;
    if (candidate.length > maxWidth && currentLine.length > firstLineIndent.length) {
      pushLine();
      currentLine = `${subsequentIndent}${word}`;
      continue;
    }
    currentLine = candidate;
  }

  if (currentLine.length > 0) {
    pushLine();
  }

  return lines;
};

const formatMarkdownForPdf = (content: string): string[] => {
  const lines: string[] = [];
  const rawLines = content.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of rawLines) {
    const base = stripLeadingSymbols(rawLine);
    const trimmed = base.trim();
    if (!trimmed) {
      lines.push(" ");
      continue;
    }

    if (/^[-_*]{3,}$/.test(trimmed)) {
      lines.push(" ");
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#{1,6}\s+/, "").toUpperCase();
      lines.push(...wrapParagraph(title, { maxWidth: 60 }));
      lines.push(" ");
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const bullet = trimmed.replace(/^[-*+]\s+/, "");
      lines.push(...wrapParagraph(bullet, { firstLineIndent: "• ", subsequentIndent: "  " }));
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const prefix = `${numberedMatch[1]}. `;
      const indent = " ".repeat(prefix.length);
      lines.push(...wrapParagraph(numberedMatch[2], { firstLineIndent: prefix, subsequentIndent: indent }));
      continue;
    }

    lines.push(...wrapParagraph(trimmed));
  }

  return lines.length > 0 ? lines : [" "];
};

const chunkLines = (lines: string[], size: number): string[][] => {
  if (lines.length === 0) {
    return [[" "]];
  }
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += size) {
    chunks.push(lines.slice(i, i + size));
  }
  return chunks;
};

const mapCharToAnsi = (char: string): number => {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) {
    return 32;
  }
  if (codePoint >= 32 && codePoint <= 126) {
    return codePoint;
  }

  const override = WIN_ANSI_OVERRIDES[char];
  if (typeof override === "number") {
    return override;
  }

  return 32;
};

const encodePdfLine = (line: string): string => {
  const value = line && line.length > 0 ? line : " ";
  const hexParts: string[] = [];
  for (const char of value) {
    const code = mapCharToAnsi(char);
    hexParts.push(code.toString(16).padStart(2, "0"));
  }
  if (hexParts.length === 0) {
    hexParts.push("20");
  }
  return `<${hexParts.join("")}>`;
};

const buildTextStream = (lines: string[]): string => {
  const sanitized = lines.length > 0 ? lines : [" "];
  const [firstLine, ...rest] = sanitized;

  const commands = [
    "BT",
    "/F1 12 Tf",
    "1 16 TL",
    "50 750 Td",
    `${encodePdfLine(firstLine)} Tj`,
    ...rest.map((line) => `T* ${encodePdfLine(line)} Tj`),
    "ET",
  ];

  return commands.join("\n");
};

const buildPdfBytes = (content: string): Uint8Array => {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const append = (text: string, trackOffset = false) => {
    if (trackOffset) {
      offsets.push(currentOffset);
    }
    const encoded = encoder.encode(`${text}\n`);
    parts.push(encoded);
    currentOffset += encoded.length;
  };

  const allLines = formatMarkdownForPdf(content);
  const pages = chunkLines(allLines, LINES_PER_PAGE);
  const pageCount = pages.length;
  const totalObjects = 3 + pageCount * 2;
  const fontObjectId = 3 + pageCount * 2;
  const objects: string[] = new Array(totalObjects + 1).fill("");

  objects[1] = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";

  const kids = pages
    .map((_, index) => {
      const pageObjectId = 3 + index * 2;
      return `${pageObjectId} 0 R`;
    })
    .join(" ");
  objects[2] = `2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pageCount} >> endobj`;

  pages.forEach((lines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const textStream = buildTextStream(lines);
    const streamLength = encoder.encode(textStream).length;

    objects[
      pageObjectId
    ] = `${pageObjectId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >> endobj`;
    objects[contentObjectId] = `${contentObjectId} 0 obj << /Length ${streamLength} >> stream\n${textStream}\nendstream endobj`;
  });

  objects[fontObjectId] = `${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj`;

  append("%PDF-1.4");
  for (let index = 1; index < objects.length; index += 1) {
    append(objects[index], true);
  }

  const xrefOffset = currentOffset;
  const xrefEntries =
    offsets
      .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `)
      .join("\n") + "\n";
  append(
    `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${xrefEntries}trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    false,
  );

  const pdfBytes = new Uint8Array(currentOffset);
  let position = 0;
  for (const chunk of parts) {
    pdfBytes.set(chunk, position);
    position += chunk.length;
  }
  return pdfBytes;
};

export const downloadPlanPdf = async (plan: string, fileName = "plan-adapt2life.pdf") => {
  if (typeof window === "undefined") {
    return;
  }
  const pdfBytes = buildPdfBytes(plan);
  const bufferCopy = new Uint8Array(pdfBytes);
  const blob = new Blob([bufferCopy], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};
