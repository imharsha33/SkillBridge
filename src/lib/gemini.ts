import { AnalysisResult, Mode } from "@/types/analysis";

const OLLAMA_BASE_URL = "/ollama";
const OLLAMA_MODEL = "llama3.2";

function buildPrompt(currentSyllabus: string, targetSyllabus: string, mode: Mode): string {
  const context = mode === "academic"
    ? `You are an expert academic advisor analyzing a student's current course syllabus vs. a target course syllabus.`
    : `You are an expert career advisor analyzing a person's current skills/resume vs. a target job description.`;

  return `${context}

## Current ${mode === "academic" ? "Course Syllabus" : "Skills / Resume"}:
${currentSyllabus}

## Target ${mode === "academic" ? "Course Syllabus" : "Job Description"}:
${targetSyllabus}

Analyze the gap between what the person currently knows and what they need for the target. Return a JSON object (and ONLY valid JSON, no markdown fences, no extra text) with EXACTLY this structure:

{
  "readinessScore": <number 0-100>,
  "riskLevel": "<low | medium | high>",
  "gaps": [
    {
      "topic": "<topic name>",
      "severity": "<critical | moderate | minor>",
      "bloomLevel": "<remember | understand | apply | analyze | evaluate>",
      "description": "<brief description of the gap>"
    }
  ],
  "dependencies": {
    "nodes": [
      { "id": "<unique_id>", "label": "<concept name>", "severity": "<critical | moderate | minor | covered>" }
    ],
    "edges": [
      { "source": "<node_id>", "target": "<node_id>" }
    ]
  },
  "bloomBreakdown": {
    "remember": ["<topic>"],
    "understand": ["<topic>"],
    "apply": ["<topic>"],
    "analyze": ["<topic>"],
    "evaluate": ["<topic>"]
  },
  "difficultyCurve": [
    { "week": 1, "difficulty": 3 },
    { "week": 2, "difficulty": 5 },
    { "week": 3, "difficulty": 6 },
    { "week": 4, "difficulty": 7 },
    { "week": 5, "difficulty": 8 },
    { "week": 6, "difficulty": 9 }
  ],
  "criticalFoundations": ["<missing foundation 1>", "<missing foundation 2>"],
  "studyPlan": [
    {
      "hour": "Hour 1-4",
      "topic": "<topic>",
      "activity": "<what to do>",
      "resources": [
        { "title": "<resource name>", "url": "https://example.com", "difficulty": "beginner", "type": "article" }
      ]
    }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "<question text>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctIndex": 0,
      "topic": "<related topic>",
      "explanation": "<why the correct answer is correct>"
    }
  ],
  "transparencyNote": "<explain how the analysis was performed>"
}

IMPORTANT RULES:
- Generate exactly 5 quiz questions with ids q1-q5
- Generate 4-6 gap topics
- Generate 6-10 dependency nodes with edges
- Generate a 6-entry study plan
- Populate ALL Bloom's taxonomy levels
- Use real URLs for resources (YouTube, MDN, GeeksforGeeks, Khan Academy, freeCodeCamp, etc.)
- Ensure dependency node ids match edge source/target values
- Return ONLY the JSON object. No markdown, no explanation, no code fences.`;
}

export async function analyzeSyllabi(
  currentSyllabus: string,
  targetSyllabus: string,
  mode: Mode
): Promise<AnalysisResult> {
  // Check if Ollama is running
  try {
    const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: "GET" });
    if (!healthCheck.ok) {
      throw new Error("Ollama server is not responding");
    }
  } catch (err) {
    throw new Error(
      "Cannot connect to Ollama. Please make sure Ollama is running (run: brew services start ollama)"
    );
  }

  const prompt = buildPrompt(currentSyllabus, targetSyllabus, mode);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a JSON-only response bot. You MUST respond with valid JSON only. No markdown, no code fences, no explanations outside JSON. Your entire response must be a single valid JSON object."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.7,
        num_predict: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const text = data?.message?.content;
  if (!text) {
    throw new Error("No response received from Ollama. Please try again.");
  }

  // Parse the JSON response — clean up any markdown fences just in case
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const result: AnalysisResult = JSON.parse(cleaned);

    // Validate and fix required fields
    if (typeof result.readinessScore !== "number") {
      result.readinessScore = 50;
    }
    if (!["low", "medium", "high"].includes(result.riskLevel)) {
      result.riskLevel = result.readinessScore >= 70 ? "low" : result.readinessScore >= 40 ? "medium" : "high";
    }
    if (!Array.isArray(result.gaps)) {
      result.gaps = [];
    }
    if (!result.dependencies || !Array.isArray(result.dependencies.nodes)) {
      result.dependencies = { nodes: [], edges: [] };
    }
    if (!result.bloomBreakdown) {
      result.bloomBreakdown = { remember: [], understand: [], apply: [], analyze: [], evaluate: [] };
    }
    // Ensure all bloom levels exist
    for (const level of ["remember", "understand", "apply", "analyze", "evaluate"] as const) {
      if (!Array.isArray(result.bloomBreakdown[level])) {
        result.bloomBreakdown[level] = [];
      }
    }
    if (!Array.isArray(result.difficultyCurve) || result.difficultyCurve.length === 0) {
      result.difficultyCurve = [
        { week: 1, difficulty: 3 }, { week: 2, difficulty: 5 },
        { week: 3, difficulty: 6 }, { week: 4, difficulty: 7 },
        { week: 5, difficulty: 8 }, { week: 6, difficulty: 9 },
      ];
    }
    if (!Array.isArray(result.criticalFoundations)) {
      result.criticalFoundations = [];
    }
    if (!Array.isArray(result.studyPlan)) {
      result.studyPlan = [];
    }
    // Ensure study plan resources are arrays
    result.studyPlan = result.studyPlan.map(entry => ({
      ...entry,
      resources: Array.isArray(entry.resources) ? entry.resources : [],
    }));
    if (!Array.isArray(result.quiz) || result.quiz.length === 0) {
      result.quiz = [];
    }
    if (!result.transparencyNote) {
      result.transparencyNote = "Analysis performed by local Ollama AI model based on syllabus comparison.";
    }

    return result;
  } catch (parseError) {
    console.error("Failed to parse Ollama response:", cleaned);
    throw new Error(
      "Failed to parse AI response. The model returned invalid JSON. Please try again."
    );
  }
}
