import type { NextApiRequest, NextApiResponse } from "next";
import { handleCors } from "@/utils/apiCors";
import { getSkins } from "@/utils/spriteManifest";

// GET /api/sprites/<unit_id>
// unit_id に紐付く skin 一覧を返す。該当なしでも 200 { skins: [] }。
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "method not allowed" });
  }

  const unitId = String(req.query.unitId);
  return res.status(200).json({ skins: getSkins(unitId) });
}
