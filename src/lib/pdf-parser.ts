import * as pdfjsLib from "pdfjs-dist";

// Use the worker from the installed pdfjs-dist package via Vite's URL resolution
const workerUrl = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;

/**
 * Extract all text content from a PDF file.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        // Disable font loading to avoid standardFontDataUrl errors
        disableFontFace: true,
        // Use standard fonts without external data
        standardFontDataUrl: undefined,
    });

    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .filter((item: any) => typeof item === "object" && "str" in item)
            .map((item: any) => item.str)
            .join(" ");
        if (pageText.trim()) {
            textParts.push(pageText.trim());
        }
    }

    const result = textParts.join("\n\n");

    if (!result.trim()) {
        throw new Error("No text content found in PDF. The file may be image-based or empty.");
    }

    return result;
}
