import yaml from "js-yaml";
import fs from "fs";
import path from "path";

type SkinInfo = {
  index: number;
  files: string[];
  nameJa?: string;
  nameEn?: string;
};

export type SpriteInfo = {
  id: string;
  sortIndex: string;
  nameJa: string;
  nameEn: string;
  skins: SkinInfo[];
};

type SpriteNamesJson = Record<
  string,
  Record<string, { ja: string; en: string; files?: string[] }>
>;

export function loadYaml<T>(yamlPath: string) {
  return yaml.load(
    fs.readFileSync(path.join(process.cwd(), yamlPath), "utf-8")
  ) as T;
}

function loadSpriteNames(): SpriteNamesJson {
  const file = path.join(process.cwd(), "assets/spriteNames.json");
  if (!fs.existsSync(file)) {
    console.warn(
      "assets/spriteNames.json が見つかりません。skin名は連番表示にフォールバックします。" +
        " 生成するには `yarn build:sprite-names` を実行してください。"
    );
    return {};
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as SpriteNamesJson;
}

export function loadSprites() {
  const spriteNames = loadSpriteNames();

  const spriteInfo: SpriteInfo[] = loadYaml<SpriteInfo[]>("assets/sprite.yaml")
    .map((x) => {
      const skins: SkinInfo[] = [];
      const spritePath = path.join(
        process.cwd(),
        "public/static/image/sprite/" + x.id
      );
      const rootFiles = fs.readdirSync(spritePath);
      if (rootFiles.length === 0)
        throw new Error(`ディレクトリが空: ${spritePath}`);
      if (!fs.statSync(path.join(spritePath, rootFiles[0])).isDirectory()) {
        rootFiles.forEach((y, i) => skins.push({ index: i, files: [y] }));
        return { ...x, skins };
      }

      const nameMap = spriteNames[x.id] ?? {};
      rootFiles.forEach((folder, i) => {
        const images = fs.readdirSync(path.join(spritePath, folder));
        const names = nameMap[folder];
        // expression_list 順にソートされたファイルリストが spriteNames.json にあれば使う。
        // ない場合はファイルシステムの列挙順 (= ファイル名順) にフォールバック。
        const sortedFiles = names?.files?.length ? names.files : images;
        skins.push({
          index: i,
          files: sortedFiles.map((f) => `${folder}/${f}`),
          ...(names?.ja ? { nameJa: names.ja } : {}),
          ...(names?.en ? { nameEn: names.en } : {}),
        });
      });
      return { ...x, skins };
    })
    .sort((a, b) =>
      a.sortIndex < b.sortIndex ? -1 : a.sortIndex > b.sortIndex ? 1 : 0
    );

  return spriteInfo;
}
