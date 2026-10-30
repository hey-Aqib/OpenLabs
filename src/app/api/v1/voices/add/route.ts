import { NextRequest, NextResponse } from "next/server";
import { extractAcousticFeaturesFromBuffer } from "@/lib/cloner";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let name = "Custom Cloned Voice";
    let description = "";
    let buffer: Buffer = Buffer.alloc(1024);

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string) || "Custom Cloned Voice";
      description = (formData.get("description") as string) || "";
      
      const file = formData.get("files") as File | null;
      if (file) {
        const ab = await file.arrayBuffer();
        buffer = Buffer.from(ab);
      }
    } else {
      const body = await req.json();
      name = body.name || "Custom Cloned Voice";
      description = body.description || "";
      if (body.audio_base64) {
        buffer = Buffer.from(body.audio_base64, "base64");
      }
    }

    const clonedVoice = extractAcousticFeaturesFromBuffer(buffer, name, description);

    return NextResponse.json({
      voice_id: clonedVoice.voice_id,
      name: clonedVoice.name,
      status: "created",
      message: `Voice '${clonedVoice.name}' cloned successfully!`,
      acoustic_params: clonedVoice.acoustic_params
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to clone voice" }, { status: 400 });
  }
}
