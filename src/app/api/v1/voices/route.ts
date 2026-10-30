import { NextResponse } from "next/server";
import { getAllVoices } from "@/lib/voices";

export async function GET() {
  const voices = getAllVoices();
  return NextResponse.json({ voices });
}
