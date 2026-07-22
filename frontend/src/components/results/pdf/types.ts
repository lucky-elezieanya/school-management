import { RefObject } from "react";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";

export interface PdfActionProps {
  pdfRef: RefObject<HTMLElement | null>;
  snapshot: StudentResultSnapshot;
}
