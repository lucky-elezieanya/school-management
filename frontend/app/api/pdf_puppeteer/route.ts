import { NextRequest, NextResponse } from "next/server";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { generateStudentPdf } from "@/src/pdf/generateStudentPdf";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-render-secret");

  if (token !== process.env.PDF_RENDER_SECRET) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot: StudentResultSnapshot = await request.json();

    const pdf = await generateStudentPdf(snapshot);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        detail: "Unable to generate PDF.",
      },
      {
        status: 500,
      },
    );
  }
}
