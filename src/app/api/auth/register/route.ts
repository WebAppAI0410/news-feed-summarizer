import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth-utils";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = registerSchema.parse(body);
    
    // ユーザー作成
    const user = await createUser(
      validatedData.email,
      validatedData.password,
      validatedData.name
    );
    
    // パスワードを除外してレスポンス
    const { password: _password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      message: "ユーザーが正常に作成されました",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました" },
      { status: 500 }
    );
  }
}