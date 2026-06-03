import type { NextApiRequest, NextApiResponse } from "next";

// you-kai.net のブラウザなど外部オリジンからの GET を許可するため CORS ヘッダを付与する。
// 公開データなので全オリジン許可。OPTIONS プリフライトはここで 204 終了させる。
// 戻り値が true のとき呼び出し側は処理を継続せず return する。
export function handleCors(req: NextApiRequest, res: NextApiResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
