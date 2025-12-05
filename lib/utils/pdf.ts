const LINES_PER_PAGE = 42;
const MAX_LINE_WIDTH = 88;

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
    if (candidate.length > maxWidth && currentLine.length > 0) {
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
    const trimmed = rawLine.trim();
    if (!trimmed) {
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

    lines.push(...wrapParagraph(rawLine.trim()));
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

const appendCodePointHex = (codePoint: number, target: string[]) => {
  if (codePoint <= 0xffff) {
    target.push(codePoint.toString(16).padStart(4, "0"));
    return;
  }
  const value = codePoint - 0x10000;
  const high = 0xd800 + (value >> 10);
  const low = 0xdc00 + (value & 0x3ff);
  target.push(high.toString(16).padStart(4, "0"));
  target.push(low.toString(16).padStart(4, "0"));
};

const encodePdfLine = (line: string): string => {
  const hexParts = ["FEFF"];
  if (!line) {
    appendCodePointHex(0x20, hexParts);
  } else {
    for (const char of line) {
      const codePoint = char.codePointAt(0);
      if (typeof codePoint === "number") {
        appendCodePointHex(codePoint, hexParts);
      }
    }
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
    "50 780 Td",
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

  objects[fontObjectId] = `${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`;

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

export const downloadPlanPdf = (plan: string, fileName = "plan-adapt2life.pdf") => {
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
