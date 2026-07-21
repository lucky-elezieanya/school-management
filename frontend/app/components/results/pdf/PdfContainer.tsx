"use client";

import { forwardRef } from "react";

import ResultSheet from "../ResultSheet";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";

interface Props {
  snapshot: StudentResultSnapshot;
}

const PdfContainer = forwardRef<HTMLDivElement, Props>(({ snapshot }, ref) => {
  return (
    <div
      className="
          flex
          justify-center
       
        "
    >
      <div
        ref={ref}
        className="
            overflow-hidden
           
            bg-white
            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
            ring-1
            ring-slate-200
            transition-shadow
            p-4
            duration-300
            hover:shadow-[0_30px_80px_rgba(0,0,0,0.22)]
          "
      >
        <ResultSheet snapshot={snapshot} />
      </div>
    </div>
  );
});

PdfContainer.displayName = "PdfContainer";

export default PdfContainer;
