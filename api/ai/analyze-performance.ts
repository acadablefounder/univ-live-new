import { VercelRequest, VercelResponse } from "@vercel/node";

interface QuestionData {
  id: string;
  text: string;
  type: "mcq" | "integer";
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer?: string | number;
  explanation?: string;
  section?: string;
  marks?: number;
}

interface UserResponse {
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean;
  marks?: number;
}

interface AnalysisRequest {
  questions: QuestionData[];
  responses: UserResponse[];
  testTitle: string;
  subject: string;
  totalScore: number;
  maxScore: number;
  accuracy: number;
}

interface AnalysisResponse {
  overallAnalysis: string;
  weakAreas: string[];
  strengths: string[];
  prerequisites: Array<{
    topic: string;
    importance: "high" | "medium" | "low";
    relatedQuestions: string[];
    description: string;
  }>;
  topicMapping: Array<{
    topic: string;
    questionsItCovers: string[];
    estimatedMarksGain: number;
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
  marksProjection: {
    currentScore: number;
    potentialScore: number;
    improvementAreas: Array<{
      topic: string;
      possibleMarksGain: number;
      effort: "easy" | "medium" | "hard";
    }>;
  };
  suggestions: string[];
  nextTestRecommendations: string[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { questions, responses, testTitle, subject, totalScore, maxScore, accuracy } = req.body as AnalysisRequest;

    if (!questions || !responses) {
      return res.status(400).json({ error: "Missing required fields: questions, responses" });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const isDev = process.env.NODE_ENV !== "production";
    if (!groqApiKey) {
      console.error("GROQ_API_KEY not configured");
      const msg = isDev ? "GROQ_API_KEY not configured on server. Add it to Vercel environment variables or .env.local for local dev." : "API configuration error";
      return res.status(500).json({ error: msg });
    }

    // Build the prompt for Groq
    const prompt = buildAnalysisPrompt(
      questions,
      responses,
      testTitle,
      subject,
      totalScore,
      maxScore,
      accuracy
    );

    // Call Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768", // Fast, capable model
        messages: [
          {
            role: "system",
            content: `You are an expert educational analyst. Analyze student test performance and provide detailed insights about:
1. Where they are lagging
2. Basic prerequisites they're missing
3. Which topics cover which prerequisites
4. How marks can be improved by covering those topics

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "overallAnalysis": "string",
  "weakAreas": ["string"],
  "strengths": ["string"],
  "prerequisites": [{"topic": "string", "importance": "high|medium|low", "relatedQuestions": ["string"], "description": "string"}],
  "topicMapping": [{"topic": "string", "questionsItCovers": ["string"], "estimatedMarksGain": number, "difficulty": "beginner|intermediate|advanced"}],
  "marksProjection": {
    "currentScore": number,
    "potentialScore": number,
    "improvementAreas": [{"topic": "string", "possibleMarksGain": number, "effort": "easy|medium|hard"}]
  },
  "suggestions": ["string"],
  "nextTestRecommendations": ["string"]
}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error("Groq API error:", error);
      const msg = isDev ? `Groq API error: ${error}` : "Failed to analyze performance";
      return res.status(500).json({ error: msg });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No response from AI" });
    }

    // Parse the JSON response - handle potential markdown wrapping
    let analysis: AnalysisResponse;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonString = jsonMatch[1] || content;
      analysis = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      const msg = isDev ? `Failed to parse AI analysis: ${String(parseError)} -- content: ${String(content).slice(0,200)}` : "Failed to parse AI analysis";
      return res.status(500).json({ error: msg });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Error in analyze-performance:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({ error: isDev ? String(error) : "Internal server error" });
  }
}

function buildAnalysisPrompt(
  questions: QuestionData[],
  responses: UserResponse[],
  testTitle: string,
  subject: string,
  totalScore: number,
  maxScore: number,
  accuracy: number
): string {
  const incorrectResponses = responses.filter((r) => !r.isCorrect);

  const questionsText = questions
    .map((q, idx) => {
      const response = responses.find((r) => r.questionId === q.id);
      const status = response?.isCorrect ? "✓ CORRECT" : "✗ INCORRECT";
      return `
Q${idx + 1} [${status}] (${q.marks || 4} marks):
Text: ${q.text}
${q.options ? `Options: ${q.options.join(" | ")}` : ""}
${q.type === "integer" ? `Type: Numerical` : ""}
Section: ${q.section || "General"}
Student's Answer: ${response?.userAnswer || "Not answered"}
Correct Answer: ${q.type === "integer" ? q.correctAnswer : (q.options?.[q.correctOptionIndex ?? 0] || q.correctAnswer)}
Explanation: ${q.explanation || "N/A"}
`;
    })
    .join("\n---\n");

  return `
ANALYZE THIS TEST PERFORMANCE:
Test: ${testTitle} (${subject})
Score: ${totalScore}/${maxScore} (${accuracy}% accuracy)
Total Questions: ${questions.length}
Incorrect: ${incorrectResponses.length}

QUESTIONS AND RESPONSES:
${questionsText}

Please provide a comprehensive analysis that includes:
1. Where the student is lagging (based on incorrect answers)
2. The basic prerequisites/concepts they're missing
3. Which topics cover each prerequisite
4. Exact marks that can be gained by mastering those topics
5. Difficulty level for each topic
6. Effort required to improve

Be specific - reference question numbers and explain the root cause of each wrong answer.`;
}
