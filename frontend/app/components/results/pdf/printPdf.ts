import { RefObject } from "react";
import { useReactToPrint } from "react-to-print";

export function usePrintPdf(ref: RefObject<HTMLElement | null>) {
  return useReactToPrint({
    contentRef: ref,

    documentTitle: "Student Result",
  });
}
