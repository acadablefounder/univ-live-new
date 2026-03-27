export type AiImportStatus = "ready" | "partial" | "rejected";

export type AiImportPreviewItem = {
  sourceIndex: number;
  status: AiImportStatus;
  question: string;
  options: string[];
  correctOption: number | null;
  reasons: string[];
  marks: number;
  negativeMarks: number;
  include: boolean;
  rawBlock?: string;
};

export type AiImportSummary = {
  total: number;
  ready: number;
  partial: number;
  rejected: number;
};

export type AiImportResponse = {
  summary: AiImportSummary;
  items: Omit<AiImportPreviewItem, "include">[];
  meta?: {
    fileName?: string;
    extractedChars?: number;
    segmentCount?: number;
    diagnostics?: string[];
  };
};

type PdfJsTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
};

type PdfJsModule = {
  getDocument: (src: { data: Uint8Array; useWorkerFetch?: boolean; isEvalSupported?: boolean }) => { promise: Promise<any> };
  GlobalWorkerOptions: { workerSrc: string };
};

const PDFJS_VERSION = "4.10.38";
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

async function loadPdfJs(): Promise<PdfJsModule> {
  const pdfjs = (await import(/* @vite-ignore */ PDFJS_MODULE_URL)) as unknown as PdfJsModule;
  if (pdfjs?.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  }
  return pdfjs;
}

function normalizeLineText(input: string) {
  return input
    .replace(/\s+/g, " ")
    .replace(/ ?([,:;!?])/g, "$1")
    .trim();
}

function buildPageText(items: PdfJsTextItem[]) {
  const positioned = items
    .map((item) => {
      const text = typeof item?.str === "string" ? item.str : "";
      const transform = Array.isArray(item?.transform) ? item.transform : [];
      const x = Number(transform[4] ?? 0);
      const y = Number(transform[5] ?? 0);
      return { text: normalizeLineText(text), x, y };
    })
    .filter((item) => item.text);

  if (!positioned.length) return "";

  positioned.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 2) return b.y - a.y;
    return a.x - b.x;
  });

  const lineTolerance = 2.5;
  const lines: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = [];

  for (const item of positioned) {
    const current = lines[lines.length - 1];
    if (!current || Math.abs(current.y - item.y) > lineTolerance) {
      lines.push({ y: item.y, parts: [{ x: item.x, text: item.text }] });
      continue;
    }
    current.parts.push({ x: item.x, text: item.text });
  }

  return lines
    .map((line) =>
      line.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

async function extractPdfTextWithPdfJs(file: File): Promise<string> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data, useWorkerFetch: true, isEvalSupported: false });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const items = Array.isArray(textContent?.items) ? (textContent.items as PdfJsTextItem[]) : [];
    const pageText = buildPageText(items);
    if (pageText) pages.push(pageText);
  }

  return pages
    .join("\n\n")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function importQuestionsFromPdf(
  file: File,
  context?: { testTitle?: string; subject?: string }
): Promise<AiImportResponse> {
  const pdfText = await extractPdfTextWithPdfJs(file);
  if (!pdfText) {
    throw new Error("This PDF does not contain readable text. Scanned image PDFs are not supported in the current text-only importer.");
  }

  const res = await fetch("/api/ai/import-test-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      pdfText,
      testTitle: context?.testTitle || "",
      subject: context?.subject || "",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to import questions from PDF");
  }

  return data as AiImportResponse;
}

export function formatNegativeMarksDisplay(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n < 0) return String(n);
  return `-${n}`;
}

function cleanText(input: string) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function buildPlaceholderOption(index: number) {
  return `[Review Required] Option ${String.fromCharCode(65 + index)}`;
}

export function buildImportedQuestionPayload(item: AiImportPreviewItem) {
  const cleanQuestion = cleanText(item.question);
  const options = Array.isArray(item.options)
    ? item.options.map((option) => cleanText(option)).filter(Boolean).slice(0, 4)
    : [];

  const hasQuestion = Boolean(cleanQuestion);
  const hasEnoughOptions = options.length >= 2;
  const hasValidCorrectOption =
    typeof item.correctOption === "number" && item.correctOption >= 0 && item.correctOption < options.length;

  const ready = item.status === "ready" && hasQuestion && hasEnoughOptions && hasValidCorrectOption;

  const payloadOptions = ready
    ? options
    : (() => {
        const next = [...options];
        while (next.length < 4) next.push(buildPlaceholderOption(next.length));
        return next.slice(0, 4);
      })();

  return {
    question: hasQuestion ? cleanQuestion : "[Review Required] Question text could not be extracted from the PDF.",
    options: payloadOptions,
    correctOption: hasValidCorrectOption ? Number(item.correctOption) : 0,
    explanation: "",
    difficulty: "medium" as const,
    subject: "",
    topic: "",
    marks: 5,
    negativeMarks: -1,
    isActive: ready,
    source: ready ? "ai_import" : "ai_import_partial",
    importStatus: ready ? "ready" : "partial",
    reviewRequired: !ready,
    importIssues: Array.isArray(item.reasons) ? item.reasons.filter(Boolean) : [],
    importSourceIndex: item.sourceIndex,
    rawImportBlock: item.rawBlock || "",
  };
}
