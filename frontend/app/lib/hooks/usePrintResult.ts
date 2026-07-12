"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export function usePrintResult() {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,

    documentTitle: "Student Result",

    pageStyle: `
      @page{
        size:A4 portrait;
        margin:8mm;
      }

      @media print{

        html,
        body{
          width:210mm;
          height:297mm;
          -webkit-print-color-adjust:exact;
          print-color-adjust:exact;
        }

        img{
          max-width:100%;
        }

      }
    `,
  });

  return {
    contentRef,
    handlePrint,
  };
}
