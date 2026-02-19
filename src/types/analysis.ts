export type Mode = "academic" | "career";

export interface GapTopic {
  topic: string;
  severity: "critical" | "moderate" | "minor";
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate";
  description: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  severity: "critical" | "moderate" | "minor" | "covered";
}

export interface DependencyEdge {
  source: string;
  target: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  topic: string;
  explanation: string;
}

export interface StudyResource {
  title: string;
  url: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  type: "video" | "article" | "tutorial" | "documentation";
  duration?: string;
}

export interface StudyPlanEntry {
  hour: string;
  topic: string;
  activity: string;
  resources: StudyResource[];
}

export interface AnalysisResult {
  readinessScore: number;
  riskLevel: "low" | "medium" | "high";
  gaps: GapTopic[];
  dependencies: {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
  };
  bloomBreakdown: {
    remember: string[];
    understand: string[];
    apply: string[];
    analyze: string[];
    evaluate: string[];
  };
  difficultyCurve: { week: number; difficulty: number }[];
  criticalFoundations: string[];
  studyPlan: StudyPlanEntry[];
  quiz: QuizQuestion[];
  transparencyNote: string;
}
