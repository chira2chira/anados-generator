# anados-generator

「アナドス」というスマートフォン向けゲームのスクリーンショット風画像を、Web上で自作できる「アナドス会話ジェネレーター」のリポジトリ。
ユーザーが背景画像を選び、キャラ立ち絵 (sprite) を配置し、会話ウィンドウ / スチルウィンドウ / エリア名などの UI を載せた画像を Konva で合成・ダウンロードできる。

公開先: `https://anados-generator.vercel.app/` (Vercel ホスティング想定)。

## 技術スタック

- Next.js 14 (Pages Router) + React 18 + TypeScript
- スタイリング: `@emotion/react` + `@blueprintjs/core`
- キャンバス描画: `konva` (`Konva.Stage` / `Konva.Layer` / `Konva.Image`)
- 国際化: `next-i18next` (`ja` / `en`)
- DnD: `react-dnd` 系
- YAML 読み: `js-yaml`

## ディレクトリ構成

```
assets/
  sprite.yaml             # キャラID/表示名/sortIndexのマスター (リポ管理)
  spriteNames.json        # buildSpriteNames.js で生成する skin 表示名 (リポ管理)
  data/                   # マスターデータJSON置き場 (.gitignore 済)
    .gitkeep              # ディレクトリ存続用

public/
  static/image/sprite/<spriteId>/<skinFolder>/fg_***.webp
                          # 立ち絵画像 (リポに大量にコミットされている)
  locales/{ja,en}/common.json  # next-i18next 翻訳

src/
  pages/
    index.tsx             # 唯一のページ。getStaticProps で loadSprites()
    _app.tsx _document.tsx
  components/
    TalkGenerator/        # メインUI (Konva Stage 管理 / 入力フォーム束ね)
    SpriteAdd/            # 立ち絵レイヤー追加。sprite/skin/表情のプルダウン
    ImageAdd/             # ユーザーアップロード画像レイヤー追加
    ImageControll/        # 個別レイヤーの位置・回転・スケール・不透明度操作
    RubyModal/            # ルビ付き文字挿入モーダル
    CommonMeta/           # OGP/meta タグ
    GoogleAnalytics/
  hooks/
    useFile.ts            # FileReader で画像を base64 化
    useThrottle.ts
    usePageView.ts
  utils/
    loadSprite.ts         # サーバ側で sprite.yaml + spriteNames.json + 画像ディレクトリを集約
    talkCanvasUtil.ts     # Konva 描画ユーティリティ (会話ウィンドウ / スチル / エリア名 / ルビ)
    gtag.ts env.ts
  styles/

scripts/
  buildSpriteNames.js     # 巨大マスター → 軽量 spriteNames.json 生成 (手動実行)
```

## データフロー (重要)

1. `scripts/buildSpriteNames.js` を `yarn build:sprite-names` で手動実行 → `assets/spriteNames.json` を生成。
   - 結合キー: sprite ファイル stem (`fg_<id>_skin***`) ↔ `UAnadosCharacter.SubFileName` の `/` 以降 → `CharacterName` ↔ `master_galleries.ucharacter_name` → `title_jp` / `title_en`。
   - `<br>` タグは空白に正規化。マッチしない skin はログに warn を出し JSON から除外 (= アプリ側で連番フォールバック)。
2. `src/utils/loadSprite.ts` の `loadSprites()` がサーバ側 (getStaticProps) で `sprite.yaml` を読み、各 sprite の skin フォルダ列挙 + `spriteNames.json` の名前を付与して `SpriteInfo[]` を返す。
   - `getStaticProps` の戻り値は JSON シリアライズされるため、`nameJa`/`nameEn` は値があるときだけスプレッドで付ける (`undefined` 不可)。
3. ブラウザ側の `SpriteAdd` が `i18n.language` に応じて `nameJa` / `nameEn` を表示。未設定 skin は `t("ui.text.spriteSkin") + paddingZero(...)` で連番フォールバック。

## よく使うコマンド

```bash
yarn dev                  # 開発サーバ (localhost:3000)
yarn build                # 本番ビルド
yarn start                # 本番ビルド起動
yarn lint                 # next lint
yarn build:sprite-names   # assets/data/* から spriteNames.json を再生成
```

## 新しい sprite を追加するときの流れ

1. `public/static/image/sprite/<spriteId>/<skinFolder>/fg_***.webp` を配置。
2. `assets/sprite.yaml` に `id` / `sortIndex` / `nameJa` / `nameEn` を追記。
3. (skin 名をマスターから反映したい場合) `assets/data/` を最新化し、`yarn build:sprite-names` を実行して `assets/spriteNames.json` を更新。
4. `yarn dev` で動作確認。

## 注意点

- `spriteNames.json` には skin の表示名のみが入り、巨大マスター由来の他データはアプリに混入しない。
- sprite フォルダで「skin フォルダ階層を持たない」(画像が直下に並ぶ) 構造のものは `loadSprite.ts` 側で 1ファイル = 1skin として扱う。スクリプトはこれをスキップしてアプリのフォールバックに任せる。
- Konva 描画は `TalkGenerator` で Stage を 1 つ作り、`bgLayer` (背景) / 任意の追加 Layer (Image/Sprite) / `uiLayer` (会話ウィンドウ) の順で重ねる。レイヤー順は `SpriteAdd` の上下ボタンで `moveUp` / `moveDown` する。
