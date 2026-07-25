export async function htmlToPdf(element: HTMLElement): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const worker = html2pdf()
    .set({
      margin: 0,
      image: {
        type: "png",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    })
    .from(element);

  return await worker.outputPdf("blob");
}
