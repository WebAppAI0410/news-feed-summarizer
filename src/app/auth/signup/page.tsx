"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // パスワード確認
    if (formData.password !== formData.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 8) {
      setError("パスワードは8文字以上である必要があります");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登録に失敗しました");
      }

      // 登録成功後、ログインページへリダイレクト
      router.push("/auth/signin?registered=true");
    } catch (error) {
      setError(error instanceof Error ? error.message : "登録中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">アカウント作成</CardTitle>
          <CardDescription>
            新しいアカウントを作成して始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前（オプション）</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="山田 太郎"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="8文字以上"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="パスワードを再入力"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "登録中..." : "アカウントを作成"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちの場合は、
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              ログイン
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}