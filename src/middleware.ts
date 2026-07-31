import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// public/ 配下の静的ファイルのキャッシュ制御。
//
// Vercel の public/ 配信デフォルトは `public, max-age=0, must-revalidate` で、
// ブラウザキャッシュが効かず再訪のたびに条件付き GET が飛ぶ。304 でも Edge Requests は
// 1 カウントされるため、リクエスト自体を発生させないようキャッシュ期間を明示する。
//
// next.config.js の headers() / vercel.json の headers はどちらも public/ 配下の
// 静的ファイルには適用されない (デプロイして実測済み)。静的アセットの配信が
// ルーティング層より手前で Cache-Control を確定させてしまうため。
// middleware はレスポンス生成後にヘッダーを差し替えられるのでこれが唯一効く経路。
//
// matcher で対象パスを絞っているため、ページ (i18n locale prefix 付き) や
// /_next/static には一切影響しない。ブラウザキャッシュが効いた後は
// リクエスト自体が飛ばないので middleware invocation も発生しない。
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/static/image/sprite/")) {
    // 立ち絵画像は追加のみで既存ファイルを上書きしない運用のため immutable 可。
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (pathname === "/spriteManifest.json") {
    // 外部 (you-kai.net 等) が直接 fetch する立ち絵 manifest。
    // sprite 追加時に内容が変わるため immutable にはせず 8 時間で再取得させる。
    res.headers.set("Cache-Control", "public, max-age=28800");
    // Vercel は静的ファイルに ACAO: * を付けるが、その挙動に依存せず明示する。
    res.headers.set("Access-Control-Allow-Origin", "*");
  }

  return res;
}

export const config = {
  matcher: ["/static/image/sprite/:path*", "/spriteManifest.json"],
};
