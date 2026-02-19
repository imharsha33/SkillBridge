import { jsPDF } from "jspdf";
import { AnalysisResult } from "@/types/analysis";

// Color palette matching the app theme
const COLORS = {
    bg: [13, 15, 23] as [number, number, number],
    cardBg: [22, 27, 42] as [number, number, number],
    primary: [139, 92, 246] as [number, number, number],
    accent: [99, 179, 237] as [number, number, number],
    success: [72, 187, 120] as [number, number, number],
    warning: [236, 201, 75] as [number, number, number],
    destructive: [245, 101, 101] as [number, number, number],
    text: [226, 232, 240] as [number, number, number],
    textMuted: [148, 163, 184] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
};

function setColor(pdf: jsPDF, color: [number, number, number]) {
    pdf.setTextColor(color[0], color[1], color[2]);
}

function setFillColor(pdf: jsPDF, color: [number, number, number]) {
    pdf.setFillColor(color[0], color[1], color[2]);
}

function drawRoundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number, color: [number, number, number]) {
    setFillColor(pdf, color);
    pdf.roundedRect(x, y, w, h, r, r, "F");
}

function addPageIfNeeded(pdf: jsPDF, y: number, needed: number): number {
    if (y + needed > 275) {
        pdf.addPage();
        // Background
        setFillColor(pdf, COLORS.bg);
        pdf.rect(0, 0, 210, 297, "F");
        return 15;
    }
    return y;
}

export function generateAnalysisPdf(result: AnalysisResult, mode: string): void {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // ==========================================
    // PAGE 1: Cover + Summary
    // ==========================================

    // Background
    setFillColor(pdf, COLORS.bg);
    pdf.rect(0, 0, 210, 297, "F");

    // Header gradient bar
    setFillColor(pdf, COLORS.primary);
    pdf.rect(0, 0, 210, 3, "F");

    // Title
    let y = 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    setColor(pdf, COLORS.white);
    pdf.text("SkillBridge", margin, y);

    pdf.setFontSize(11);
    setColor(pdf, COLORS.textMuted);
    pdf.text("AI-Powered Skill Gap Analysis Report", margin, y + 8);

    // Date
    pdf.setFontSize(9);
    pdf.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y + 14);
    pdf.text(`Mode: ${mode === "academic" ? "Academic" : "Career"}`, margin + 80, y + 14);

    y = 45;

    // ---- Readiness Score Card ----
    drawRoundedRect(pdf, margin, y, contentWidth, 35, 3, COLORS.cardBg);

    // Score circle
    const scoreX = margin + 20;
    const scoreY = y + 17;
    const scoreRadius = 12;

    // Circle background
    pdf.setDrawColor(50, 55, 70);
    pdf.setLineWidth(1.5);
    pdf.circle(scoreX, scoreY, scoreRadius, "S");

    // Score arc color based on value
    const scoreColor = result.readinessScore >= 70 ? COLORS.success : result.readinessScore >= 40 ? COLORS.warning : COLORS.destructive;
    pdf.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.setLineWidth(2.5);
    pdf.circle(scoreX, scoreY, scoreRadius, "S");

    // Score number
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    setColor(pdf, COLORS.white);
    pdf.text(`${result.readinessScore}%`, scoreX, scoreY + 2, { align: "center" });

    pdf.setFontSize(8);
    setColor(pdf, COLORS.textMuted);
    pdf.text("Readiness", scoreX, scoreY + 8, { align: "center" });

    // Risk level badge
    const riskColor = result.riskLevel === "low" ? COLORS.success : result.riskLevel === "medium" ? COLORS.warning : COLORS.destructive;
    const riskLabel = `${result.riskLevel.toUpperCase()} RISK`;
    drawRoundedRect(pdf, margin + 45, y + 8, 30, 8, 2, [riskColor[0], riskColor[1], riskColor[2]]);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    setColor(pdf, COLORS.white);
    pdf.text(riskLabel, margin + 60, y + 13.5, { align: "center" });

    // Failure probability
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setColor(pdf, COLORS.textMuted);
    pdf.text(`${100 - result.readinessScore}% failure probability`, margin + 45, y + 24);

    // Summary stats on the right
    pdf.setFontSize(9);
    setColor(pdf, COLORS.accent);
    pdf.text(`${result.gaps.length} Gaps Identified`, margin + 110, y + 12);
    pdf.text(`${result.criticalFoundations.length} Critical Foundations Missing`, margin + 110, y + 19);
    pdf.text(`${result.quiz.length} Quiz Questions`, margin + 110, y + 26);

    y += 42;

    // ---- Critical Missing Foundations ----
    y = addPageIfNeeded(pdf, y, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("⚠ Critical Missing Foundations", margin, y);
    y += 7;

    drawRoundedRect(pdf, margin, y, contentWidth, Math.max(10, result.criticalFoundations.length * 7 + 6), 3, COLORS.cardBg);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    for (const foundation of result.criticalFoundations) {
        y = addPageIfNeeded(pdf, y, 8);
        // Red bullet
        setFillColor(pdf, COLORS.destructive);
        pdf.circle(margin + 5, y - 1, 1.2, "F");
        setColor(pdf, COLORS.text);
        pdf.text(foundation, margin + 10, y);
        y += 7;
    }
    y += 5;

    // ---- Gap Analysis ----
    y = addPageIfNeeded(pdf, y, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("📋 Gap Analysis", margin, y);
    y += 8;

    // Table header
    drawRoundedRect(pdf, margin, y, contentWidth, 8, 2, [30, 35, 55]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor(pdf, COLORS.textMuted);
    pdf.text("Topic", margin + 4, y + 5.5);
    pdf.text("Bloom Level", margin + 95, y + 5.5);
    pdf.text("Severity", margin + 140, y + 5.5);
    y += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    for (const gap of result.gaps) {
        y = addPageIfNeeded(pdf, y, 10);
        drawRoundedRect(pdf, margin, y, contentWidth, 8, 1, [18, 22, 35]);

        // Severity dot
        const sevColor = gap.severity === "critical" ? COLORS.destructive : gap.severity === "moderate" ? COLORS.warning : COLORS.primary;
        setFillColor(pdf, sevColor);
        pdf.circle(margin + 4, y + 4, 1.2, "F");

        // Topic
        setColor(pdf, COLORS.text);
        pdf.text(gap.topic, margin + 9, y + 5.5);

        // Bloom level
        const bloomColor = gap.bloomLevel === "remember" ? COLORS.accent :
            gap.bloomLevel === "understand" ? COLORS.primary :
                gap.bloomLevel === "apply" ? COLORS.warning :
                    gap.bloomLevel === "analyze" ? COLORS.success : COLORS.destructive;
        setColor(pdf, bloomColor);
        pdf.text(gap.bloomLevel, margin + 95, y + 5.5);

        // Severity badge
        drawRoundedRect(pdf, margin + 137, y + 1, 25, 6, 2, [sevColor[0], sevColor[1], sevColor[2]]);
        pdf.setFontSize(8);
        setColor(pdf, COLORS.white);
        pdf.text(gap.severity, margin + 149.5, y + 5.2, { align: "center" });
        pdf.setFontSize(9);

        y += 10;
    }
    y += 5;

    // ---- Bloom's Taxonomy Breakdown ----
    y = addPageIfNeeded(pdf, y, 40);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("🎓 Bloom's Taxonomy Breakdown", margin, y);
    y += 8;

    const bloomLevels = ["remember", "understand", "apply", "analyze", "evaluate"] as const;
    const bloomColors: Record<string, [number, number, number]> = {
        remember: COLORS.accent,
        understand: COLORS.primary,
        apply: COLORS.warning,
        analyze: COLORS.success,
        evaluate: COLORS.destructive,
    };

    const colWidth = contentWidth / 5;
    for (let i = 0; i < bloomLevels.length; i++) {
        const level = bloomLevels[i];
        const topics = result.bloomBreakdown[level] || [];
        const x = margin + i * colWidth;
        const cardHeight = Math.max(20, topics.length * 6 + 14);

        y = addPageIfNeeded(pdf, y, cardHeight + 5);

        // Level badge
        drawRoundedRect(pdf, x, y, colWidth - 2, 7, 2, bloomColors[level]);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        setColor(pdf, COLORS.white);
        pdf.text(level.charAt(0).toUpperCase() + level.slice(1), x + (colWidth - 2) / 2, y + 5, { align: "center" });

        // Topics
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        setColor(pdf, COLORS.textMuted);
        let topicY = y + 11;
        for (const topic of topics) {
            const truncated = topic.length > 18 ? topic.slice(0, 16) + "…" : topic;
            pdf.text(truncated, x + 2, topicY);
            topicY += 5;
        }
    }

    y += Math.max(20, Math.max(...bloomLevels.map(l => (result.bloomBreakdown[l] || []).length)) * 6 + 14) + 5;

    // ---- Study Plan ----
    y = addPageIfNeeded(pdf, y, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("📖 24-Hour Bridge Study Plan", margin, y);
    y += 8;

    for (const entry of result.studyPlan) {
        y = addPageIfNeeded(pdf, y, 18);
        drawRoundedRect(pdf, margin, y, contentWidth, 14, 2, COLORS.cardBg);

        // Hour badge
        drawRoundedRect(pdf, margin + 3, y + 3, 22, 8, 2, COLORS.primary);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        setColor(pdf, COLORS.white);
        pdf.text(entry.hour, margin + 14, y + 8.5, { align: "center" });

        // Topic + Activity
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        setColor(pdf, COLORS.text);
        pdf.text(entry.topic, margin + 30, y + 6);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        setColor(pdf, COLORS.textMuted);
        const activity = entry.activity.length > 80 ? entry.activity.slice(0, 78) + "…" : entry.activity;
        pdf.text(activity, margin + 30, y + 11.5);

        y += 16;
    }
    y += 5;

    // ---- Quiz Questions ----
    y = addPageIfNeeded(pdf, y, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("⚡ Diagnostic Quiz", margin, y);
    y += 8;

    for (let qi = 0; qi < result.quiz.length; qi++) {
        const q = result.quiz[qi];
        y = addPageIfNeeded(pdf, y, 30);

        drawRoundedRect(pdf, margin, y, contentWidth, 26, 2, COLORS.cardBg);

        // Question number badge
        drawRoundedRect(pdf, margin + 3, y + 3, 8, 6, 2, COLORS.primary);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        setColor(pdf, COLORS.white);
        pdf.text(`Q${qi + 1}`, margin + 7, y + 7, { align: "center" });

        // Question text
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setColor(pdf, COLORS.text);
        const questionText = q.question.length > 90 ? q.question.slice(0, 88) + "…" : q.question;
        pdf.text(questionText, margin + 14, y + 7);

        // Options
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        const optionLabels = ["A", "B", "C", "D"];
        for (let oi = 0; oi < q.options.length && oi < 4; oi++) {
            const isCorrect = oi === q.correctIndex;
            const optX = margin + 14 + oi * 43;
            const optY = y + 13;

            if (isCorrect) {
                drawRoundedRect(pdf, optX - 2, optY - 3, 40, 6, 1, [72, 187, 120, 0.3] as any);
                setColor(pdf, COLORS.success);
            } else {
                setColor(pdf, COLORS.textMuted);
            }

            const optText = q.options[oi].length > 20 ? q.options[oi].slice(0, 18) + "…" : q.options[oi];
            pdf.text(`${optionLabels[oi]}. ${optText}`, optX, optY);
        }

        // Topic tag
        pdf.setFontSize(7);
        setColor(pdf, COLORS.accent);
        pdf.text(`Topic: ${q.topic}`, margin + 14, y + 22);

        y += 28;
    }
    y += 5;

    // ---- Transparency Note ----
    y = addPageIfNeeded(pdf, y, 25);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(pdf, COLORS.white);
    pdf.text("🛡 How Was This Calculated?", margin, y);
    y += 8;

    drawRoundedRect(pdf, margin, y, contentWidth, 20, 3, COLORS.cardBg);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    setColor(pdf, COLORS.textMuted);
    const noteLines = pdf.splitTextToSize(result.transparencyNote || "Analysis powered by local Ollama AI.", contentWidth - 10);
    pdf.text(noteLines, margin + 5, y + 7);

    // ---- Footer on last page ----
    const lastPageY = 285;
    setFillColor(pdf, COLORS.primary);
    pdf.rect(0, lastPageY, 210, 12, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setColor(pdf, COLORS.white);
    pdf.text("Generated by SkillBridge — AI-Powered Skill Gap Analysis", 105, lastPageY + 5, { align: "center" });
    pdf.text(`${new Date().toISOString().slice(0, 10)}`, 105, lastPageY + 9, { align: "center" });

    // Save as PDF with explicit Blob download to guarantee .pdf extension
    const pdfBlob = pdf.output("blob");
    const fileName = `SkillBridge_Analysis_${new Date().toISOString().slice(0, 10)}.pdf`;

    const downloadUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}
