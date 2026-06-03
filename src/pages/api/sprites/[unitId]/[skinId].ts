import type { NextApiRequest, NextApiResponse } from "next";
import { handleCors } from "@/utils/apiCors";
import { getImages } from "@/utils/spriteManifest";

// GET /api/sprites/<unit_id>/<skin_id>
// unit_id + skin_id に紐付く画像フルパス一覧を返す。
// unit_id もしくは skin_id が見つからない場合は 404。
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "method not allowed" });
  }

  const unitId = String(req.query.unitId);
  const skinId = String(req.query.skinId);
  const images = getImages(unitId, skinId);
  if (images === null) {
    return res.status(404).json({ error: "not found" });
  }
  return res.status(200).json({ images });
}
