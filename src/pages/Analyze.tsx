import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ArrowLeft, Loader2, AlertTriangle, Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mode, AnalysisResult } from "@/types/analysis";
import { analyzeSyllabi } from "@/lib/gemini";
import { extractTextFromPdf } from "@/lib/pdf-parser";
import { useToast } from "@/hooks/use-toast";

interface PdfState {
    file: File | null;
    text: string;
    loading: boolean;
    error: string | null;
}

const Analyze = () => {
    const [mode, setMode] = useState<Mode>("academic");
    const [currentPdf, setCurrentPdf] = useState<PdfState>({ file: null, text: "", loading: false, error: null });
    const [targetPdf, setTargetPdf] = useState<PdfState>({ file: null, text: "", loading: false, error: null });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const currentInputRef = useRef<HTMLInputElement>(null);
    const targetInputRef = useRef<HTMLInputElement>(null);

    const handlePdfUpload = async (
        file: File,
        setter: React.Dispatch<React.SetStateAction<PdfState>>
    ) => {
        if (file.type !== "application/pdf") {
            setter({ file: null, text: "", loading: false, error: "Please upload a PDF file." });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setter({ file: null, text: "", loading: false, error: "File too large. Max 10MB." });
            return;
        }

        setter({ file, text: "", loading: true, error: null });

        try {
            const text = await extractTextFromPdf(file);
            if (!text.trim()) {
                setter({ file, text: "", loading: false, error: "Could not extract text. The PDF may be image-based or empty." });
                return;
            }
            setter({ file, text, loading: false, error: null });
        } catch (err: any) {
            console.error("PDF parsing error:", err);
            setter({ file: null, text: "", loading: false, error: "Failed to parse PDF. Please try another file." });
        }
    };

    const handleDrop = (
        e: React.DragEvent,
        setter: React.Dispatch<React.SetStateAction<PdfState>>
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handlePdfUpload(file, setter);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const clearPdf = (setter: React.Dispatch<React.SetStateAction<PdfState>>, inputRef: React.RefObject<HTMLInputElement | null>) => {
        setter({ file: null, text: "", loading: false, error: null });
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleAnalyze = async () => {
        if (!currentPdf.text.trim() || !targetPdf.text.trim()) {
            toast({ title: "Missing input", description: "Please upload both PDF files.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const result = await analyzeSyllabi(currentPdf.text, targetPdf.text, mode);
            navigate("/results", { state: { result: result as AnalysisResult, mode, currentSyllabus: currentPdf.text, targetSyllabus: targetPdf.text } });
        } catch (err: any) {
            console.error("Analysis error:", err);
            toast({
                title: "Analysis failed",
                description: err.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderUploadZone = (
        label: string,
        pdfState: PdfState,
        setter: React.Dispatch<React.SetStateAction<PdfState>>,
        inputRef: React.RefObject<HTMLInputElement | null>,
        inputId: string
    ) => (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfUpload(file, setter);
                }}
            />

            {!pdfState.file && !pdfState.loading ? (
                <div
                    onDrop={(e) => handleDrop(e, setter)}
                    onDragOver={handleDragOver}
                    onClick={() => inputRef.current?.click()}
                    className="min-h-[240px] glass border-2 border-dashed border-border/50 hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group hover:bg-primary/5"
                >
                    <div className="w-16 h-16 rounded-2xl glass-strong flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                        Drop your PDF here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Supports .pdf files up to 10MB
                    </p>
                </div>
            ) : pdfState.loading ? (
                <div className="min-h-[240px] glass rounded-2xl flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Extracting text from PDF...</p>
                </div>
            ) : pdfState.error ? (
                <div className="min-h-[240px] glass border-2 border-destructive/30 rounded-2xl flex flex-col items-center justify-center p-6">
                    <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
                    <p className="text-sm text-destructive text-center mb-4">{pdfState.error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearPdf(setter, inputRef)}
                        className="text-muted-foreground"
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="min-h-[240px] glass border-2 border-success/30 rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                    {pdfState.file?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(pdfState.file?.size ? pdfState.file.size / 1024 : 0).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => clearPdf(setter, inputRef)}
                            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-destructive/20 transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <span className="text-xs text-success font-medium">
                            Text extracted successfully ({pdfState.text.length.toLocaleString()} characters)
                        </span>
                    </div>
                    <div className="flex-1 rounded-xl bg-muted/30 p-3 overflow-y-auto max-h-[120px]">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                            {pdfState.text.slice(0, 500)}{pdfState.text.length > 500 ? "..." : ""}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background relative">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-primary" />
                        <span className="font-display font-bold text-foreground">SkillBridge</span>
                    </div>
                    <div className="glass rounded-full p-1 flex gap-1">
                        {(["academic", "career"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${mode === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {m === "academic" ? "🎓 Academic" : "💼 Career"}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                        {mode === "academic" ? "Compare Course Syllabi" : "Skills vs. Job Description"}
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Upload your PDF files and our AI will generate a comprehensive readiness analysis.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {renderUploadZone(
                            mode === "academic" ? "Current Course Syllabus (PDF)" : "Your Current Skills / Resume (PDF)",
                            currentPdf,
                            setCurrentPdf,
                            currentInputRef,
                            "current-pdf-input"
                        )}
                        {renderUploadZone(
                            mode === "academic" ? "Target Course Syllabus (PDF)" : "Target Job Description (PDF)",
                            targetPdf,
                            setTargetPdf,
                            targetInputRef,
                            "target-pdf-input"
                        )}
                    </div>

                    {(currentPdf.text.length > 0 && currentPdf.text.length < 30) || (targetPdf.text.length > 0 && targetPdf.text.length < 30) ? (
                        <div className="flex items-center gap-2 text-warning text-sm mb-4">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Low content detected in uploaded PDF — results may be less accurate.</span>
                        </div>
                    ) : null}

                    <Button
                        onClick={handleAnalyze}
                        disabled={loading || !currentPdf.text.trim() || !targetPdf.text.trim()}
                        className="w-full gradient-primary border-0 text-primary-foreground font-display font-semibold text-lg py-6 rounded-xl glow-primary hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing with Ollama AI...
                            </>
                        ) : (
                            "🔍 Analyze My Readiness"
                        )}
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default Analyze;
