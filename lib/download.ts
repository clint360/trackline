"use client";

// html-to-image tries to inline cross-origin stylesheets (e.g. Google Fonts), which
// throws a CORS SecurityError when reading cssRules. `skipFonts: true` avoids that
// path entirely; system / web fonts still render correctly in the rasterized output.
const exportOptions = {
  pixelRatio: 2,
  cacheBust: true,
  backgroundColor: "#ffffff",
  skipFonts: true,
} as const;

export async function downloadAsPng(node: HTMLElement, filename: string) {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, exportOptions);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function downloadAsPdf(node: HTMLElement, filename: string) {
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);
  const dataUrl = await toPng(node, exportOptions);

  // Compute target size from image natural size
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((res) => {
    img.onload = () => res();
  });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width, img.height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(filename);
}
