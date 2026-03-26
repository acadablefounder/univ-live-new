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

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function importQuestionsFromPdf(
  file: File,
  context?: { testTitle?: string; subject?: string }
): Promise<AiImportResponse> {
  const pdfBase64 = await fileToBase64(file);

  const res = await fetch("/api/ai/import-test-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      pdfBase64,
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
