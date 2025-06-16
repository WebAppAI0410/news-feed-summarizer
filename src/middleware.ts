import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 保護されたルートの定義
const protectedRoutes = [
  "/api/feeds",
  "/api/articles",
  "/api/summarize",
  "/dashboard",
  "/settings",
];

// 管理者のみアクセス可能なルート
const adminRoutes = [
  "/api/cron",
  "/admin",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  // 保護されたルートへのアクセスチェック
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 管理者ルートへのアクセスチェック
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 未認証ユーザーが保護されたルートにアクセスしようとした場合
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 非管理者が管理者ルートにアクセスしようとした場合
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (認証エンドポイント)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};