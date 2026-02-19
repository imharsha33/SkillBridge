import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Brain, ArrowLeft, AlertTriangle, Shield, ChevronDown, ChevronUp,
    BookOpen, BarChart3, GitBranch, Zap, GraduationCap, Download, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReadinessScoreRing from "@/components/ReadinessScoreRing";
import ConceptGraph from "@/components/ConceptGraph";
import DiagnosticQuiz from "@/components/DiagnosticQuiz";
import { AnalysisResult, Mode } from "@/types/analysis";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateAnalysisPdf } from "@/lib/pdf-export";

const bloomColors: Record<string, string> = {
    remember: "bg-accent/20 text-accent",
    understand: "bg-primary/20 text-primary",
    apply: "bg-warning/20 text-warning",
    analyze: "bg-success/20 text-success",
    evaluate: "bg-destructive/20 text-destructive",
};

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { result: AnalysisResult; mode: Mode } | null;
    const { toast } = useToast();

    const [simulatedHours, setSimulatedHours] = useState(0);
    const [quizAdjustment, setQuizAdjustment] = useState(0);
    const [exportingPdf, setExportingPdf] = useState(false);

    if (!state?.result) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-display text-2xl font-bold text-foreground mb-2">No Analysis Data</h2>
                    <p className="text-muted-foreground mb-4">Please run an analysis first.</p>
                    <Button onClick={() => navigate("/analyze")} className="gradient-primary border-0 text-primary-foreground">
                        Go to Analysis
                    </Button>
                </div>
            </div>
        );
    }

    const { result, mode } = state;
    const simulatedScore = Math.min(100, result.readinessScore + simulatedHours * 1.5 + quizAdjustment);

    const riskBadge = {
        low: { color: "bg-success/20 text-success border-success/30", label: "Low Risk" },
        medium: { color: "bg-warning/20 text-warning border-warning/30", label: "Medium Risk" },
        high: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "High Risk" },
    }[result.riskLevel];

    const handleQuizComplete = (correct: number) => {
        const bonus = Math.round((correct / result.quiz.length) * 10);
        setQuizAdjustment(bonus);
    };

    const handleExportPdf = async () => {
        setExportingPdf(true);
        toast({ title: "Generating PDF...", description: "Creating your analysis report." });

        try {
            generateAnalysisPdf(result, mode);
            toast({ title: "PDF exported!", description: "Your analysis report has been saved." });
        } catch (err) {
            console.error("PDF export error:", err);
            toast({
                title: "Export failed",
                description: "Could not generate the PDF. Please try again.",
                variant: "destructive",
            });
        } finally {
            setExportingPdf(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => navigate("/analyze")} className="text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> New Analysis
                    </Button>
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-primary" />
                        <span className="font-display font-bold text-foreground">SkillBridge</span>
                    </div>
                    <Button
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={handleExportPdf}
                        disabled={exportingPdf}
                    >
                        {exportingPdf ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" /> Export PDF
                            </>
                        )}
                    </Button>
                </div>

                {/* Capturable report area */}
                <div>
                    {/* Top row: Score + Risk + Critical Foundations */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
                            <ReadinessScoreRing score={Math.round(simulatedScore)} />
                            <div className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge.color}`}>
                                {riskBadge.label} — {Math.round(100 - simulatedScore)}% failure probability
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
                            <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-destructive" /> Critical Missing Foundations
                            </h3>
                            <ul className="space-y-2">
                                {result.criticalFoundations.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                        <span className="text-foreground">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
                            <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-accent" /> Expected Difficulty Curve
                            </h3>
                            <ResponsiveContainer width="100%" height={140}>
                                <AreaChart data={result.difficultyCurve}>
                                    <defs>
                                        <linearGradient id="diffGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(262, 83%, 65%)" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="hsl(262, 83%, 65%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ background: "hsl(230, 25%, 11%)", border: "1px solid hsl(230, 20%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                                    />
                                    <Area type="monotone" dataKey="difficulty" stroke="hsl(262, 83%, 65%)" fill="url(#diffGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    {/* Bloom's Taxonomy */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 mb-6">
                        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                            <GraduationCap className="w-4 h-4 text-primary" /> Bloom's Taxonomy Breakdown
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {(Object.entries(result.bloomBreakdown) as [string, string[]][]).map(([level, topics]) => (
                                <div key={level} className="space-y-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${bloomColors[level]}`}>{level}</span>
                                    <ul className="space-y-1">
                                        {topics.map((t, i) => (
                                            <li key={i} className="text-xs text-muted-foreground">{t}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Gap Analysis Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-6 mb-6">
                        <h3 className="font-display font-semibold text-foreground mb-4">📋 Gap Analysis</h3>
                        <div className="space-y-2">
                            {result.gaps.map((g, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${g.severity === "critical" ? "bg-destructive" : g.severity === "moderate" ? "bg-warning" : "bg-primary"
                                            }`} />
                                        <span className="text-sm font-medium text-foreground">{g.topic}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${bloomColors[g.bloomLevel]}`}>{g.bloomLevel}</span>
                                        <Badge variant={g.severity === "critical" ? "destructive" : "secondary"} className="text-xs capitalize">
                                            {g.severity}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Concept Dependency Graph */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
                        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                            <GitBranch className="w-4 h-4 text-accent" /> Concept Dependency Graph
                        </h3>
                        <ConceptGraph nodes={result.dependencies.nodes} edges={result.dependencies.edges} />
                    </motion.div>

                    {/* Simulation Slider */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass rounded-2xl p-6 mb-6">
                        <h3 className="font-display font-semibold text-foreground mb-4">📈 Readiness Simulation</h3>
                        <p className="text-sm text-muted-foreground mb-4">Simulate your readiness score after studying:</p>
                        <div className="flex items-center gap-4">
                            <Slider
                                value={[simulatedHours]}
                                onValueChange={(v) => setSimulatedHours(v[0])}
                                max={24}
                                step={1}
                                className="flex-1"
                            />
                            <span className="font-display text-lg font-bold text-primary min-w-[70px]">{simulatedHours}h study</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                            Projected score: <span className="text-foreground font-semibold">{Math.round(simulatedScore)}%</span>
                            {simulatedHours > 0 && (
                                <span className="text-success ml-2">(+{Math.round(simulatedHours * 1.5)}%)</span>
                            )}
                        </p>
                    </motion.div>

                    {/* Diagnostic Quiz */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
                        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-warning" /> Diagnostic Quiz
                        </h3>
                        <DiagnosticQuiz questions={result.quiz} onComplete={handleQuizComplete} />
                    </motion.div>

                    {/* Study Plan */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass rounded-2xl p-6 mb-6">
                        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                            <BookOpen className="w-4 h-4 text-success" /> 24-Hour Bridge Study Plan
                        </h3>
                        <div className="space-y-3">
                            {result.studyPlan.map((entry, i) => (
                                <div key={i} className="flex gap-4 p-3 rounded-xl bg-muted/30">
                                    <span className="font-display font-bold text-primary text-sm min-w-[60px]">{entry.hour}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{entry.topic}</p>
                                        <p className="text-xs text-muted-foreground">{entry.activity}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.resources.map((r, j) => (
                                                <a
                                                    key={j}
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`text-xs px-2 py-0.5 rounded-full ${r.difficulty === "beginner" ? "bg-success/20 text-success" :
                                                        r.difficulty === "intermediate" ? "bg-warning/20 text-warning" :
                                                            "bg-destructive/20 text-destructive"
                                                        }`}
                                                >
                                                    {r.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* AI Transparency */}
                    <Accordion type="single" collapsible className="mb-16">
                        <AccordionItem value="transparency" className="glass rounded-2xl border-border/50">
                            <AccordionTrigger className="px-6 font-display text-foreground">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" /> How was this calculated?
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4">
                                <p className="text-sm text-muted-foreground">{result.transparencyNote}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};

export default Results;

