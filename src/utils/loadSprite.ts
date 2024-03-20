import yaml from "js-yaml";
import fs from "fs";
import path from "path";

type SkinInfo = {
  index: number;
  files: string[];
};

export type SpriteInfo = {
  id: string;
  nameJa: string;
  nameEn: string;
  skins: SkinInfo[];
};

export function loadYaml<T>(yamlPath: string) {
  return yaml.load(
    fs.readFileSync(path.join(process.cwd(), yamlPath), "utf-8")
  ) as T;
}

export function loadSprites() {
  const spriteInfo: SpriteInfo[] = loadYaml<SpriteInfo[]>(
    "assets/sprite.yaml"
  ).map((x) => {
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

    rootFiles.forEach((x, i) => {
      const images = fs.readdirSync(path.join(spritePath, x));
      skins.push({ index: i, files: images.map((y) => `${x}/${y}`) });
    });
    return { ...x, skins };
  });

  return spriteInfo;
}
