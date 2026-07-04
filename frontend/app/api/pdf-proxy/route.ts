import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", {
      status: 400,
    });
  }

  const token = getAccessToken();

  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    return new NextResponse("Unable to fetch PDF", {
      status: response.status,
    });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
