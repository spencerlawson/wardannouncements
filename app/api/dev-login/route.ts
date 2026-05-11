import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// Only available in development — creates a real DB session for quick login
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const email = "spencer.lawson@gmail.com";

  let [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email, name: "Spencer Lawson", isSuperAdmin: true })
      .returning();
  } else if (!user.isSuperAdmin) {
    await db.update(users).set({ isSuperAdmin: true }).where(eq(users.id, user.id));
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({ sessionToken, userId: user.id, expires });

  const cookieStore = await cookies();
  cookieStore.set("authjs.session-token", sessionToken, {
    expires,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
