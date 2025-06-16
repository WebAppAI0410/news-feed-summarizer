import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Convex setup required" },
    { status: 503 }
  );
}

export const runtime = "edge";
export const maxDuration = 30;