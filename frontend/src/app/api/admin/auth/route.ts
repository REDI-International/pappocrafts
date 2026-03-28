import { NextRequest, NextResponse } from "next/server";
import { authenticate, validateSession, logout } from "@/lib/admin-store";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }
    const session = await authenticate(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    return NextResponse.json({
      token: session.token,
      email: session.email,
      role: session.role,
      name: session.name,
      userId: session.userId,
    });
  } catch {
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const session = await validateSession(token);
  if (!session) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }
  return NextResponse.json({
    email: session.email,
    role: session.role,
    name: session.name,
    userId: session.userId,
  });
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token) logout(token);
  return NextResponse.json({ success: true });
}
