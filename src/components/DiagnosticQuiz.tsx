import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/types/analysis";

interface DiagnosticQuizProps {
    questions: QuizQuestion[];
    onComplete: (correctCount: number) => void;
}

const DiagnosticQuiz = ({ questions, onComplete }: DiagnosticQuizProps) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const q = questions[currentIdx];

    const handleSelect = (idx: number) => {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);
        if (idx === q.correctIndex) setCorrectCount((c) => c + 1);
    };

    const handleNext = () => {
        if (currentIdx + 1 >= questions.length) {
            const final = correctCount + (selected === q.correctIndex ? 0 : 0); // already counted
            setFinished(true);
            onComplete(correctCount);
            return;
        }
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setAnswered(false);
    };

    if (finished) {
        return (
            <div className="glass rounded-2xl p-8 text-center">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Quiz Complete!</h3>
                <p className="text-muted-foreground">
                    You scored <span className="text-primary font-bold">{correctCount}/{questions.length}</span>
                </p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground font-medium">
                    Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{q.topic}</span>
            </div>

            <h3 className="font-display text-lg font-semibold text-foreground mb-5">{q.question}</h3>

            <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => {
                    let cls = "glass border border-border/50 hover:border-primary/40";
                    if (answered) {
                        if (i === q.correctIndex) cls = "border-2 border-success bg-success/10";
                        else if (i === selected) cls = "border-2 border-destructive bg-destructive/10";
                    } else if (i === selected) {
                        cls = "border-2 border-primary";
                    }
                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${cls}`}
                        >
                            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-foreground">{opt}</span>
                            {answered && i === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-success ml-auto" />}
                            {answered && i === selected && i !== q.correctIndex && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                        </button>
                    );
                })}
            </div>

            {answered && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{q.explanation}</p>
                </motion.div>
            )}

            {answered && (
                <Button onClick={handleNext} className="gradient-primary border-0 text-primary-foreground w-full">
                    {currentIdx + 1 >= questions.length ? "Finish Quiz" : "Next Question"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            )}
        </motion.div>
    );
};

export default DiagnosticQuiz;
