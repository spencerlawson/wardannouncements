export const dynamic = "force-dynamic";

import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("BLOB_READ_WRITE_TOKEN is not set");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }

    const blob = await put(file.name, file, {
      access: "public",
      token,
      contentType: file.type || "application/octet-stream",
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Blob upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 400 }
    );
  }
}
