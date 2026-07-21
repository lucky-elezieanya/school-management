export async function downloadPdf(element: HTMLElement, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;

  await html2pdf()
    .set({
      filename,
      margin: 0,
      image: {
        type: "jpeg",
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
    .from(element)
    .save();
}
