"use client";

import PdfActions from "./PdfActions";
import PdfContainer from "./PdfContainer";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { useRef } from "react";

interface Props {
  snapshot: StudentResultSnapshot;
}

export default function PdfPreview({ snapshot }: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);

  return (
    <main
      className="
        min-h-screen
        bg-slate-100
      "
    >
      {/* Sticky Toolbar */}
      <div
        className="
          sticky
          top-0
          z-50
          border-b
          border-slate-200
          bg-white/90
          backdrop-blur
          shadow-sm
        "
      >
        <div
          className="
            mx-auto
            flex
            py-2
           w-2/3
            items-center
            justify-between
       
           
          "
        >
          <PdfActions snapshot={snapshot} pdfRef={pdfRef} />
        </div>
      </div>

      {/* Document Area */}
      <section
        className="
          flex
          justify-center
   
        "
      >
        <div
          className="
           
            max-w-fit
          "
        >
          <div
            className="
              overflow-hidden
           
              bg-white
              shadow-2xl
              ring-1
              ring-black/10
              my-4
            "
          >
            <PdfContainer ref={pdfRef} snapshot={snapshot} />
          </div>
        </div>
      </section>
    </main>
  );
}
