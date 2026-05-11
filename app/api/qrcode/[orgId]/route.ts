export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateQRCodeBuffer } from "@/lib/utils/qr";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ward/${org.slug}`;
  const buffer = await generateQRCodeBuffer(wardUrl);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${org.slug}-qrcode.png"`,
    },
  });
}
