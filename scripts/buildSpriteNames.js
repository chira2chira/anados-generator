// sprite.yaml / 3001.json / UAnadosCharacter.json から
// 各 sprite の skin 表示名を抽出し assets/spriteNames.json を生成する。
// 巨大マスター (合計 22MB+) をアプリ実行時にロードせずに済ませるための事前生成スクリプト。

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const SPRITE_YAML = path.join(ROOT, "assets/sprite.yaml");
const MASTER_JSON = path.join(ROOT, "assets/data/3001.json");
const UCHARACTER_JSON = path.join(ROOT, "assets/data/UAnadosCharacter.json");
const SPRITE_DIR = path.join(ROOT, "public/static/image/sprite");
const OUTPUT = path.join(ROOT, "assets/spriteNames.json");
const MANIFEST_OUTPUT = path.join(ROOT, "assets/spriteManifest.json");

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function normalizeTitle(s) {
  // <br> はゲーム側で改行に展開されるタグだが、<select>のoptionでは
  // タグが効かずそのまま表示されてしまうため、半角空白に置換しておく。
  if (typeof s !== "string") return s;
  return s.replace(/<br\s*\/?>/gi, " ").trim();
}

function buildSubFileNameMap(uCharacterList) {
  // SubFileName の `/` 以降 (なければ全体) → CharacterName[] のマップ。
  // 1 つの SubFileName に複数の CharacterName が紐づくケースがあるため (例: バカラの
  // skin050 は "バカラミニオン" と "スパイボット統合" の両方が定義される)、候補を全て
  // 保持し、後段の master_galleries 解決で最初にヒットしたものを採用する。
  const map = new Map();
  for (const entry of uCharacterList) {
    const sub = entry.SubFileName;
    if (!sub) continue;
    const stem = sub.includes("/") ? sub.split("/").pop() : sub;
    if (!stem || !entry.CharacterName) continue;
    const arr = map.get(stem);
    if (arr) {
      if (!arr.includes(entry.CharacterName)) arr.push(entry.CharacterName);
    } else {
      map.set(stem, [entry.CharacterName]);
    }
  }
  return map;
}

function buildGalleryMap(master) {
  // ucharacter_name → { ja, en, unitId } のマップ
  const map = new Map();
  const galleries = master?.ret?.master_galleries ?? [];
  for (const g of galleries) {
    if (!g.ucharacter_name) continue;
    if (map.has(g.ucharacter_name)) continue;
    map.set(g.ucharacter_name, {
      ja: normalizeTitle(g.title_jp),
      en: normalizeTitle(g.title_en),
      zh: normalizeTitle(g.title_tw),
      unitId: g.unit_id,
    });
  }
  return map;
}

function main() {
  const sprites = yaml.load(fs.readFileSync(SPRITE_YAML, "utf-8"));
  const uCharacterList = loadJson(UCHARACTER_JSON);
  const master = loadJson(MASTER_JSON);

  const subFileMap = buildSubFileNameMap(uCharacterList);
  const galleryMap = buildGalleryMap(master);

  const result = {};
  // unit_id → [{ id, nameJa, nameEn, images: [全画像パス] }]
  // unit_id は skin 単位で紐付くため、同一 sprite フォルダ内の skin が複数 unit_id に
  // 分かれる / 1 unit_id が複数 sprite フォルダにまたがるケースを skin 粒度で統合する。
  const manifest = {};
  const unmatched = [];
  const skinIdCollisions = [];

  for (const sprite of sprites) {
    const spritePath = path.join(SPRITE_DIR, sprite.id);
    if (!fs.existsSync(spritePath)) {
      console.warn(`[skip] sprite ディレクトリが存在しない: ${sprite.id}`);
      continue;
    }
    const rootFiles = fs.readdirSync(spritePath);
    if (rootFiles.length === 0) continue;
    // skin フォルダ構造でないもの (直下に画像が並ぶもの) はスキップ。
    // 既存 loadSprite.ts と同様にアプリ側のフォールバック (連番) に任せる。
    const firstStat = fs.statSync(path.join(spritePath, rootFiles[0]));
    if (!firstStat.isDirectory()) continue;

    const skinEntries = {};

    for (const skinFolder of rootFiles) {
      const skinPath = path.join(spritePath, skinFolder);
      if (!fs.statSync(skinPath).isDirectory()) continue;
      const images = fs.readdirSync(skinPath);
      if (images.length === 0) continue;
      // 同フォルダ内ファイルは全て同じ SubFileName を指すため 1 件で十分
      const stem = path.parse(images[0]).name;
      const candidates = subFileMap.get(stem);
      if (!candidates || candidates.length === 0) {
        unmatched.push(`${sprite.id}/${skinFolder} (stem=${stem})`);
        continue;
      }
      // CharacterName 候補のうち master_galleries に登録されている最初のものを採用
      let title;
      let resolved;
      for (const name of candidates) {
        const t = galleryMap.get(name);
        if (t) {
          title = t;
          resolved = name;
          break;
        }
      }
      if (!title) {
        unmatched.push(
          `${sprite.id}/${skinFolder} (CharacterName=${candidates.join(" | ")})`
        );
        continue;
      }
      skinEntries[skinFolder] = { ja: title.ja, en: title.en };

      // manifest: unit_id 単位で skin を集約 (画像フルパス込み)
      const unitId = String(title.unitId);
      const skins = (manifest[unitId] = manifest[unitId] ?? []);
      // 異なる sprite フォルダが同じ unit_id 内で同名 skin フォルダを持つ場合は
      // id が衝突するため、衝突時のみ sprite 名を付与して一意化する (先勝ち優先で
      // 1 件目は素の skin 番号を維持)。
      let skinId = skinFolder;
      if (skins.some((s) => s.id === skinId)) {
        skinId = `${skinFolder}_${sprite.id}`;
        skinIdCollisions.push(`unit ${unitId} / ${sprite.id}/${skinFolder} → ${skinId}`);
      }
      skins.push({
        id: skinId,
        nameJa: title.ja,
        nameEn: title.en,
        nameZh: title.zh,
        images: images.map(
          (img) => `/static/image/sprite/${sprite.id}/${skinFolder}/${img}`
        ),
      });
    }

    if (Object.keys(skinEntries).length > 0) {
      result[sprite.id] = skinEntries;
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf-8");
  fs.writeFileSync(
    MANIFEST_OUTPUT,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );

  if (unmatched.length > 0) {
    console.warn(`未マッチ skin: ${unmatched.length} 件`);
    for (const u of unmatched) console.warn(`  - ${u}`);
  }
  if (skinIdCollisions.length > 0) {
    console.warn(`skin id 衝突: ${skinIdCollisions.length} 件 (sprite 名付与で一意化)`);
    for (const c of skinIdCollisions) console.warn(`  - ${c}`);
  }
  console.log(`書き出し完了: ${path.relative(ROOT, OUTPUT)}`);
  console.log(`書き出し完了: ${path.relative(ROOT, MANIFEST_OUTPUT)}`);
  console.log(
    `マッチ sprite: ${Object.keys(result).length} / ${sprites.length}`
  );
  console.log(`manifest unit 数: ${Object.keys(manifest).length}`);
}

main();
