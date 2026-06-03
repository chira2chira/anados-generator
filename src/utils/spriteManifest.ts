import manifestJson from "../../assets/spriteManifest.json";

// scripts/buildSpriteNames.js が生成する unit_id ベースの立ち絵 manifest。
// Vercel の serverless 関数は public/ をランタイム fs 列挙できないため、ビルド時に
// 確定させたこの JSON を静的 import してバンドルに同梱する。
export type ManifestSkin = {
  id: string;
  nameJa: string;
  nameEn: string;
  nameZh: string;
  images: string[];
};

type Manifest = Record<string, ManifestSkin[]>;

const manifest = manifestJson as Manifest;

export type SkinSummary = Pick<
  ManifestSkin,
  "id" | "nameJa" | "nameEn" | "nameZh"
>;

// unit_id に紐付く skin 一覧 (画像を除いたサマリ)。該当なしは空配列。
export function getSkins(unitId: string): SkinSummary[] {
  const skins = manifest[unitId];
  if (!skins) return [];
  return skins.map(({ id, nameJa, nameEn, nameZh }) => ({
    id,
    nameJa,
    nameEn,
    nameZh,
  }));
}

// unit_id + skin_id に紐付く画像フルパス一覧。該当なしは null。
export function getImages(unitId: string, skinId: string): string[] | null {
  const skins = manifest[unitId];
  if (!skins) return null;
  const skin = skins.find((s) => s.id === skinId);
  return skin ? skin.images : null;
}
