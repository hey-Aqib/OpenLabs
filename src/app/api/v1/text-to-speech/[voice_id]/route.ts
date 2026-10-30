import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/synthesizer";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ voice_id: string }> }
) {
  try {
    const params = await context.params;
    const voiceId = params.voice_id;
    const body = await req.json().catch(() => ({}));
    const text = body.text || "Hello from OpenLabs";
    const modelId = body.model_id || "openlabs_multilingual_v2";
    const voiceSettings = body.voice_settings;

    const result = await synthesizeSpeech(text, voiceId, modelId, voiceSettings);

    return new Response(new Uint8Array(result.audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": result.audioBuffer.length.toString(),
        "X-Audio-Duration": result.durationSeconds.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Synthesis failed" }, { status: 500 });
  }
}
