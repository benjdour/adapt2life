const escapePdfText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

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

  const sanitizedLines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => escapePdfText(line || " "));

  const firstLine = sanitizedLines[0] ?? " ";
  const textStream = [
    "BT",
    "/F1 12 Tf",
    "1 16 TL",
    "50 780 Td",
    `(${firstLine}) Tj`,
    ...sanitizedLines.slice(1).map((line) => `T* (${line}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${encoder.encode(textStream).length} >> stream\n${textStream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  append("%PDF-1.4");
  objects.forEach((object) => append(object, true));

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
