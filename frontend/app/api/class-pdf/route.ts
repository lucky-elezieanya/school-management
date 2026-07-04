import { BASE_URL } from "@/app/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization");

  if (!token) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const classId = request.nextUrl.searchParams.get("class_id");
  const termId = request.nextUrl.searchParams.get("term_id");
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!classId || !termId || !sessionId) {
    return new NextResponse("Missing parameters", {
      status: 400,
    });
  }

  const response = await fetch(
    `${BASE_URL}/results/results/class-results-pdf/?class_id=${classId}&term_id=${termId}&session_id=${sessionId}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    return new NextResponse(await response.text(), {
      status: response.status,
    });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
    },
  });
}
