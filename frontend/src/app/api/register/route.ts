import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/admin-store";
import { insertBuyerUser } from "@/lib/admin-user-provision";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const { error } = await insertBuyerUser({ email, password, name });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const session = await authenticate(email, password);
    if (!session) {
      return NextResponse.json(
        { error: "Account created, but automatic sign-in failed. Please sign in manually." },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        token: session.token,
        email: session.email,
        role: session.role,
        name: session.name,
        userId: session.userId,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
