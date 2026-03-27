import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  extractPdfText,
  normalizeImportedItem,
  parseJsonResponse,
  segmentQuestionCandidates,
  type ImportedQuestionItem,
} from "../_lib/pdfQuestionImport.js";

type ImportRequest = {
  pdfBase64?: string;
  pdfText?: string;
  fileName?: string;
  testTitle?: string;
  subject?: string;
};

type ModelResponse = {
  items?: Array<{
    sourceIndex?: number;
    status?: "ready" | "partial" | "rejected";
    question?: string;
    options?: string[];
    correctOption?: number | null;
    reasons?: string[];
    rawBlock?: string;
  }>;
};

type CandidateBlock = { sourceIndex: number; rawBlock: string };

const MAX_SEGMENTS = 120;
const MAX_BLOCK_CHARS = 900;
const MAX_SINGLE_BLOCK_RETRY_CHARS = 550;
const MAX_BATCH_CHARS = 1800;
const MAX_BATCH_ITEMS = 3;
const GROQ_MAX_OUTPUT_TOKENS = 850;

function buildSystemPrompt() {
  return [
    "Extract single-correct MCQ data from text blocks.",
    "Return ONLY JSON: {\"items\":[{\"sourceIndex\":1,\"status\":\"ready|partial|rejected\",\"question\":\"\",\"options\":[\"\"],\"correctOption\":0,\"reasons\":[\"\"],\"rawBlock\":\"\"}]}",
    "A ready item must have question, 2-4 options, and zero-based correctOption.",
    "If answer is unclear, use partial and correctOption null.",
    "If unusable, use rejected.",
    "Do not invent missing content.",
    "Keep rawBlock very short."
  ].join(" ");
}

function buildUserPrompt(batch: CandidateBlock[], context: { testTitle?: string; subject?: string }) {
  return JSON.stringify({
    testTitle: context.testTitle || "Unknown",
    subject: context.subject || "Unknown",
    task: "Extract MCQs from candidate blocks. Use answer hints like Ans: B or Correct option: 2 when present.",
    items: batch,
  });
}

async function groqRequest(apiKey: string, batch: CandidateBlock[], context: { testTitle?: string; subject?: string }) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(batch, context) },
      ],
      temperature: 0.1,
      max_tokens: GROQ_MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${text}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from Groq API");
  return parseJsonResponse<ModelResponse>(content);
}

function isTooLargeError(error: unknown) {
  const message = String(error || "");
  return /Request too large|tokens per minute|rate_limit_exceeded/i.test(message);
}

async function callGroqAdaptive(apiKey: string, batch: CandidateBlock[], context: { testTitle?: string; subject?: string }): Promise<ModelResponse> {
  try {
    return await groqRequest(apiKey, batch, context);
  } catch (error) {
    if (!isTooLargeError(error)) throw error;

    if (batch.length > 1) {
      const mid = Math.ceil(batch.length / 2);
      const left = await callGroqAdaptive(apiKey, batch.slice(0, mid), context);
      const right = await callGroqAdaptive(apiKey, batch.slice(mid), context);
      return { items: [...(left.items || []), ...(right.items || [])] };
    }

    const only = batch[0];
    if (!only) throw error;
    if (only.rawBlock.length <= MAX_SINGLE_BLOCK_RETRY_CHARS) throw error;

    const trimmedBatch = [{ ...only, rawBlock: only.rawBlock.slice(0, MAX_SINGLE_BLOCK_RETRY_CHARS) }];
    return await groqRequest(apiKey, trimmedBatch, context);
  }
}

function buildBatches(segments: CandidateBlock[]) {
  const batches: CandidateBlock[][] = [];
  let current: CandidateBlock[] = [];
  let currentChars = 0;

  for (const segment of segments) {
    const segChars = segment.rawBlock.length;
    if (current.length && (current.length >= MAX_BATCH_ITEMS || currentChars + segChars > MAX_BATCH_CHARS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(segment);
    currentChars += segChars;
  }

  if (current.length) batches.push(current);
  return batches;
}

function normalizeClientText(input: string) {
  return String(input || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { pdfBase64, pdfText, fileName, testTitle, subject } = (req.body || {}) as ImportRequest;
    if (!pdfText && !pdfBase64) {
      return res.status(400).json({ error: "Missing pdfText or pdfBase64" });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const isDev = process.env.NODE_ENV !== "production";
    if (!groqApiKey) {
      return res.status(500).json({ error: isDev ? "GROQ_API_KEY not configured" : "API configuration error" });
    }

    let text = "";
    let diagnostics: string[] = [];

    if (typeof pdfText === "string" && pdfText.trim()) {
      text = normalizeClientText(pdfText);
      diagnostics.push("Used client-side PDF text extraction.");
    } else {
      const buffer = Buffer.from(String(pdfBase64 || ""), "base64");
      if (!buffer.length) {
        return res.status(400).json({ error: "Uploaded PDF is empty" });
      }
      const extracted = extractPdfText(buffer);
      text = extracted.text;
      diagnostics = extracted.diagnostics;
    }

    if (!text) {
      return res.status(200).json({
        summary: { total: 0, ready: 0, partial: 0, rejected: 0 },
        items: [],
        meta: { fileName, extractedChars: 0, segmentCount: 0, diagnostics },
      });
    }

    const segments = segmentQuestionCandidates(text)
      .map((segment, index) => ({ sourceIndex: index + 1, rawBlock: segment.slice(0, MAX_BLOCK_CHARS) }))
      .filter((segment) => segment.rawBlock.trim().length >= 15)
      .slice(0, MAX_SEGMENTS);

    if (!segments.length) {
      return res.status(200).json({
        summary: { total: 0, ready: 0, partial: 0, rejected: 0 },
        items: [],
        meta: { fileName, extractedChars: text.length, segmentCount: 0, diagnostics: [...diagnostics, "No candidate question blocks found."] },
      });
    }

    const batches = buildBatches(segments);
    const results: ImportedQuestionItem[] = [];

    for (const batch of batches) {
      const parsed = await callGroqAdaptive(groqApiKey, batch, { testTitle, subject });
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];

      if (!rawItems.length) {
        for (const item of batch) {
          results.push(
            normalizeImportedItem(
              {
                sourceIndex: item.sourceIndex,
                status: "rejected",
                question: "",
                options: [],
                correctOption: null,
                reasons: ["AI could not parse this question block."],
                rawBlock: item.rawBlock,
              },
              item.sourceIndex
            )
          );
        }
        continue;
      }

      for (let offset = 0; offset < batch.length; offset += 1) {
        const source = batch[offset];
        const candidate = rawItems.find((entry) => Number(entry?.sourceIndex) === source.sourceIndex) || rawItems[offset] || {
          sourceIndex: source.sourceIndex,
          status: "rejected",
          question: "",
          options: [],
          correctOption: null,
          reasons: ["AI did not return a structured result for this block."],
          rawBlock: source.rawBlock,
        };

        results.push(normalizeImportedItem({ ...candidate, rawBlock: candidate.rawBlock || source.rawBlock }, source.sourceIndex));
      }
    }

    const unique = results.filter((item, index, arr) => {
      if (item.status === "rejected") return true;
      const signature = `${item.question.toLowerCase()}__${item.options.join("||").toLowerCase()}`;
      return arr.findIndex((entry) => entry.status !== "rejected" && `${entry.question.toLowerCase()}__${entry.options.join("||").toLowerCase()}` === signature) === index;
    });

    const summary = unique.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      { total: 0, ready: 0, partial: 0, rejected: 0 }
    );

    return res.status(200).json({
      summary,
      items: unique,
      meta: {
        fileName,
        extractedChars: text.length,
        segmentCount: segments.length,
        batchCount: batches.length,
        diagnostics,
      },
    });
  } catch (error) {
    console.error("Error in import-test-questions:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({ error: isDev ? String(error) : "Internal server error" });
  }
}
