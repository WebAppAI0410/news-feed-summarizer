import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, getUserByEmail } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Return user data without password
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    });
  } catch (error) {
    console.error("Verify credentials error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}