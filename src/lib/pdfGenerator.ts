/**
 * PDF generation utility — html2canvas + jsPDF
 *
 * Captures a DOM element at high resolution and writes it into an A4 PDF.
 * Dynamic imports keep both libraries out of the server bundle entirely.
 */

// A4 paper dimensions
const A4_W_MM = 210;
const A4_H_MM = 297;

// A4 at 96 DPI (the CSS pixel density used by the render container)
// 1 inch = 25.4 mm → 96px/in ÷ 25.4mm/in ≈ 3.7795 px/mm
const PX_PER_MM = 96 / 25.4;
const A4_W_PX = Math.round(A4_W_MM * PX_PER_MM); // 794
const A4_H_PX = Math.round(A4_H_MM * PX_PER_MM); // 1123

// 2× scale for crisp, Retina-quality output
const CANVAS_SCALE = 2;

// Height of one A4 page measured in canvas pixels (post-scale)
const PAGE_H_CANVAS_PX = A4_H_PX * CANVAS_SCALE; // 2246

export interface PDFResult {
  blob: Blob;
  /** Temporary object URL — revoke when no longer needed */
  url: string;
}

/**
 * Renders `element` to a high-resolution canvas and packs it into an A4 PDF.
 * Handles multi-page resumes by slicing the canvas into page-height chunks.
 *
 * @param element  The DOM element to capture (must be in the DOM, can be off-screen)
 * @param filename Base filename (without extension) for the downloaded file
 */
export async function generatePDF(
  element: HTMLElement,
  filename: string
): Promise<PDFResult> {
  // Lazy-load browser-only libraries — never runs on the server
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;

  // Wait for fonts to finish loading so text renders correctly
  if (typeof document !== "undefined" && document.fonts) {
    await document.fonts.ready;
  }

  // ── 1. Render element to canvas ───────────────────────────────────────────
  const canvas = await html2canvas(element, {
    scale: CANVAS_SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    // Use the element's own scroll dimensions as the virtual window,
    // which ensures off-screen overflow is still captured correctly.
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const { width: canvasW, height: canvasH } = canvas;

  // ── 2. Create PDF ─────────────────────────────────────────────────────────
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const totalPages = Math.ceil(canvasH / PAGE_H_CANVAS_PX);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    // Vertical range of the canvas that falls on this page
    const srcY = page * PAGE_H_CANVAS_PX;
    const srcH = Math.min(PAGE_H_CANVAS_PX, canvasH - srcY);

    // ── 3. Slice the canvas for this page ──────────────────────────────────
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvasW;
    sliceCanvas.height = srcH;

    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D canvas context");

    ctx.drawImage(
      canvas,
      0, srcY, canvasW, srcH, // source rect
      0, 0,    canvasW, srcH  // destination rect
    );

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);

    // Height of this slice in mm, proportional to a full A4 page
    const sliceH_mm = (srcH / PAGE_H_CANVAS_PX) * A4_H_MM;

    // Stretch image to fill the A4 page width; height is proportional
    pdf.addImage(imgData, "JPEG", 0, 0, A4_W_MM, sliceH_mm);
  }

  // ── 4. Return blob + object URL ───────────────────────────────────────────
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);

  return { blob, url };
}
