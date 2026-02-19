import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, GitBranch, BarChart3, Zap, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mode } from "@/types/analysis";

const features = [
    { icon: Brain, title: "AI Gap Analysis", desc: "Identifies missing prerequisites using Gemini AI" },
    { icon: GitBranch, title: "Dependency Graph", desc: "Interactive concept prerequisite visualization" },
    { icon: BarChart3, title: "Readiness Score", desc: "Quantified readiness with risk assessment" },
    { icon: Zap, title: "Adaptive Quiz", desc: "5 MCQs that recalculate your score" },
    { icon: BookOpen, title: "Study Plan", desc: "24-hour bridge plan with ranked resources" },
    { icon: Sparkles, title: "Bloom's Taxonomy", desc: "Topics classified by cognitive level" },
];

const Index = () => {
    const [mode, setMode] = useState<Mode>("academic");
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="relative z-10">
                {/* Nav */}
                <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Brain className="w-7 h-7 text-primary" />
                        <span className="font-display font-bold text-lg text-foreground">SkillBridge</span>
                    </div>
                    <div className="glass rounded-full p-1 flex gap-1">
                        {(["academic", "career"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {m === "academic" ? "🎓 Academic" : "💼 Career"}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Hero */}
                <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span className="text-sm text-muted-foreground">Powered by Ollama AI (Local)</span>
                        </div>
                        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
                            Bridge the gap between{" "}
                            <span className="gradient-text">what you know</span>{" "}
                            and what's next
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                            {mode === "academic"
                                ? "Paste your current and target course syllabi. Get an AI-powered readiness analysis with visual knowledge graphs, adaptive quizzes, and a personalized study plan."
                                : "Compare your current skills against any job description. Discover gaps, get a readiness score, and receive a tailored upskilling plan."}
                        </p>
                        <Button
                            size="lg"
                            onClick={() => navigate("/analyze")}
                            className="gradient-primary border-0 text-primary-foreground font-display font-semibold text-lg px-8 py-6 rounded-xl glow-primary hover:scale-105 transition-transform"
                        >
                            Analyze My Readiness
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                </section>

                {/* Features grid */}
                <section className="max-w-6xl mx-auto px-6 pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors group"
                            >
                                <f.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                                <p className="text-sm text-muted-foreground">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Index;
