const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // loadSprite.ts の getStaticProps が public/static/image/sprite を fs 列挙するため、
  // @vercel/nft がその画像ディレクトリ全体 (~1.8GB) をサーバ関数バンドルに同梱し
  // serverless function のサイズ上限 (250MB/300MB) を超過する。画像はビルド時のみ参照され、
  // 実行時は CDN 配信 / spriteManifest.json 経由で足りるため、関数トレースから public を除外する。
  // 注意: Next 内部のマッチングは path.join(pageDir, file) を picomatch にかけるため、
  // Windows ローカルビルドでは `\` 区切りが原因で除外が空振りし .nft.json に画像が残る。
  // デプロイ先 (Vercel = Linux) では `/` 区切りで正しく除外されるため、この設定で問題ない。
  experimental: {
    outputFileTracingExcludes: {
      "*": ["public/**"],
    },
  },
  // Vercel の public/ 配信デフォルトは `public, max-age=0, must-revalidate` で
  // ブラウザキャッシュが効かず、再訪のたびに条件付き GET (304) が飛ぶ。304 でも
  // Edge Requests は 1 カウントされるため、明示的にキャッシュ期間を指定して
  // リピート分のリクエスト自体を発生させないようにする。
  // 注意: ローカルの `next start` では public/ の静的ファイルにこの headers は適用されないが、
  // Vercel では routes-manifest.json の headers が CDN のルーティング層 (filesystem ハンドラより前)
  // に展開されるため適用される。vercel.json の headers は Next.js プロジェクトでは効かない (実測)。
  // i18n 有効時は source に locale prefix が自動付加されてしまうため locale: false が必須
  // (public/ の静的ファイルは locale prefix なしのパスで配信されるため)。
  async headers() {
    return [
      {
        // 立ち絵画像は追加のみで既存ファイルを上書きしない運用のため immutable 可。
        source: "/static/image/sprite/:path*",
        locale: false,
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // 外部 (you-kai.net 等) が直接 fetch する立ち絵 manifest。
        // sprite 追加時に内容が変わるため immutable にはせず 8 時間で再取得させる。
        source: "/spriteManifest.json",
        locale: false,
        headers: [
          { key: "Cache-Control", value: "public, max-age=28800" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
