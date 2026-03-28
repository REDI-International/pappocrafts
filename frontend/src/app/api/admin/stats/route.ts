import { NextRequest, NextResponse } from "next/server";
import { validateSession, getStats } from "@/lib/admin-store";

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getStats();
  return NextResponse.json(stats);
}
