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
};

module.exports = nextConfig;
