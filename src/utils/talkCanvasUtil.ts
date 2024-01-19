import Konva from "konva";

const RUBY_PATTERN = /\[#(.+?),.+?\]/g;

function applyScaleXFunc(layer: Konva.Layer) {
  return function (value: number) {
    const scale = layer.width() / 1920;
    return value * scale;
  };
}

function applyScaleYFunc(layer: Konva.Layer) {
  return function (value: number) {
    const scale = layer.height() / 1080;
    return value * scale;
  };
}

export function addTalkWindow(
  layer: Konva.Layer,
  char: string,
  text: string,
  bigText: boolean
): Promise<void> {
  const scale = applyScaleXFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = "/static/image/ui/anados-talk-window.png";

    img.onload = async () => {
      const baseHeight = layer.height() - scale(img.height);
      const fontSize = bigText ? 105 : 42;
      // 背景
      const windowImage = new Konva.Image({
        image: img,
        x: 0,
        y: baseHeight,
        width: scale(img.width),
        height: scale(img.height),
      });
      layer.add(windowImage);
      // 透かし
      await addWatermark(layer, true);
      // キャラ名
      const charName = new Konva.Text({
        text: char,
        x: scale(100),
        y: baseHeight + scale(24),
        width: scale(355),
        fontSize: scale(30),
        fontStyle: "500",
        fontFamily: "Noto Serif JP",
        align: "center",
        fill: "#FFFFFF",
      });
      layer.add(charName);
      // テキスト
      const textList: Konva.Text[] = [];
      let lastTextWidth = 0;
      const splitText = text.split("\n");
      splitText.forEach((line, i) => {
        let textX = 0;
        line.split("[#").forEach((t, j) => {
          let base1, base2, ruby;
          if (j === 0) {
            base1 = t;
          } else {
            const s = t.split(",");
            const s2 = s[1].split("]");
            base1 = s[0];
            base2 = s2[1];
            ruby = s2[0];
          }
          const singleText = new Konva.Text({
            text: base1,
            x: scale(200) + textX,
            y: baseHeight + scale(110 + i * (fontSize + 24)),
            fontSize: scale(fontSize),
            fontStyle: "700",
            fontFamily: "Noto Serif JP",
            align: "left",
            fill: "#000000",
          });
          textList.push(singleText);
          textX += singleText.measureSize(base1).width;

          if (ruby) {
            const rubyText = new Konva.Text({
              text: ruby,
              x: singleText.x() + singleText.measureSize(base1).width / 2,
              y: singleText.y() - scale(fontSize / 2),
              fontSize: scale(fontSize / 2),
              fontStyle: "700",
              fontFamily: "Noto Serif JP",
              align: "center",
              fill: "#000000",
            });
            rubyText.x(rubyText.x() - rubyText.measureSize(ruby).width / 2);
            rubyText.width(rubyText.measureSize(ruby).width);
            textList.push(rubyText);
          }

          if (base2) {
            const singleText2 = new Konva.Text({
              text: base2,
              x: scale(200) + textX,
              y: baseHeight + scale(110 + i * (fontSize + 24)),
              fontSize: scale(fontSize),
              fontStyle: "700",
              fontFamily: "Noto Serif JP",
              align: "left",
              fill: "#000000",
            });
            textList.push(singleText2);
            textX += singleText2.measureSize(base2).width;
          }
        });

        lastTextWidth = textX;
      });
      layer.add(...textList);
      // 文字送りアイコン
      const arrowImg = new Image();
      arrowImg.src = "/static/image/ui/anados-arrow.png";

      arrowImg.onload = () => {
        const arrowImage = new Konva.Image({
          image: arrowImg,
          x: scale(210) + lastTextWidth,
          y:
            baseHeight +
            scale(
              106 +
                fontSize -
                arrowImg.height -
                (bigText ? 10 : 3) +
                (splitText.length - 1) * (fontSize + 24)
            ),
          width: scale(arrowImg.width),
          height: scale(arrowImg.height),
        });
        layer.add(arrowImage);
        resolve();
      };
    };
  });
}

export function addAdditionalImage(
  layer: Konva.Layer,
  charImage: string,
  anchorColor: string
): Promise<Konva.Image> {
  const scaleX = applyScaleXFunc(layer);
  const scaleY = applyScaleYFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = charImage;

    img.onload = () => {
      // 背景
      const charImage = new Konva.Image({
        image: img,
        x: 0,
        y: 0,
        width: scaleX(img.width),
        height: scaleX(img.height),
        draggable: true,
      });
      charImage.cache();
      charImage.filters([Konva.Filters.HSV]);
      layer.add(charImage);
      const tr = new Konva.Transformer({
        anchorStroke: anchorColor, // アンカー枠の色
        anchorFill: "#FFFFFF", // アンカー塗りつぶしの色
        anchorSize: 20, // アンカーのサイズ
        borderStroke: anchorColor, // 枠の色
        borderDash: [3, 3], // 枠のデザイン
        keepRatio: true,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
      });
      tr.nodes([charImage]);
      layer.add(tr);
      resolve(charImage);
    };
  });
}

export function addStillWindow(
  layer: Konva.Layer,
  char: string,
  text: string,
  bigText: boolean
): Promise<void> {
  const scale = applyScaleXFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = "/static/image/ui/anados-still-backdrop.png";

    img.onload = async () => {
      const baseHeight = layer.height() - scale(img.height);
      const fontSize = bigText ? 95 : 38;
      // 背景
      const windowImage = new Konva.Image({
        image: img,
        x: 0,
        y: baseHeight,
        width: scale(img.width),
        height: scale(img.height),
      });
      layer.add(windowImage);
      // 透かし
      await addWatermark(layer, false);
      // キャラ名
      const charName = new Konva.Text({
        text: char,
        x: 0,
        y: baseHeight + scale(69),
        width: scale(535),
        fontSize: scale(30),
        fontStyle: "500",
        fontFamily: "Noto Serif JP",
        align: "right",
        fill: "#FFFFFF",
        stroke: "#000000",
        strokeWidth: scale(4),
        fillAfterStrokeEnabled: true,
      });
      layer.add(charName);
      // テキスト
      const textList: Konva.Text[] = [];
      let lastTextWidth = 0;
      const splitText = text.split("\n");
      splitText.forEach((line, i) => {
        let textX = 0;
        line.split("[#").forEach((t, j) => {
          let base1, base2, ruby;
          if (j === 0) {
            base1 = t;
          } else {
            const s = t.split(",");
            const s2 = s[1].split("]");
            base1 = s[0];
            base2 = s2[1];
            ruby = s2[0];
          }
          const singleText = new Konva.Text({
            text: base1,
            x: scale(555) + textX,
            y: baseHeight + scale(64 + i * (fontSize + 20)),
            fontSize: scale(fontSize),
            fontStyle: "500",
            fontFamily: "Noto Serif JP",
            align: "left",
            fill: "#FFFFFF",
            stroke: "#000000",
            strokeWidth: scale(4),
            fillAfterStrokeEnabled: true,
          });
          textList.push(singleText);
          textX += singleText.measureSize(base1).width;

          if (ruby) {
            const rubyText = new Konva.Text({
              text: ruby,
              x: singleText.x() + singleText.measureSize(base1).width / 2,
              y: singleText.y() - scale(fontSize / 2),
              fontSize: scale(fontSize / 2),
              fontStyle: "500",
              fontFamily: "Noto Serif JP",
              align: "center",
              fill: "#FFFFFF",
              stroke: "#000000",
              strokeWidth: scale(4),
              fillAfterStrokeEnabled: true,
            });
            rubyText.x(rubyText.x() - rubyText.measureSize(ruby).width / 2);
            rubyText.width(rubyText.measureSize(ruby).width);
            textList.push(rubyText);
          }

          if (base2) {
            const singleText2 = new Konva.Text({
              text: base2,
              x: scale(555) + textX,
              y: baseHeight + scale(64 + i * (fontSize + 20)),
              fontSize: scale(fontSize),
              fontStyle: "500",
              fontFamily: "Noto Serif JP",
              align: "left",
              fill: "#FFFFFF",
              stroke: "#000000",
              strokeWidth: scale(4),
              fillAfterStrokeEnabled: true,
            });
            textList.push(singleText2);
            textX += singleText2.measureSize(base2).width;
          }
        });
        lastTextWidth = textX;
      });
      layer.add(...textList);
      // 文字送りアイコン
      const arrowImg = new Image();
      arrowImg.src = "/static/image/ui/anados-arrow.png";

      arrowImg.onload = () => {
        const arrowImage = new Konva.Image({
          image: arrowImg,
          x: scale(575) + lastTextWidth,
          y:
            baseHeight +
            scale(
              64 +
                fontSize -
                arrowImg.height -
                (bigText ? 10 : 3) +
                (splitText.length - 1) * (fontSize + 20)
            ),
          width: scale(arrowImg.width),
          height: scale(arrowImg.height),
        });
        layer.add(arrowImage);
        resolve();
      };
    };
  });
}

export function addAreaName(
  layer: Konva.Layer,
  areaName: string
): Promise<void> {
  const scale = applyScaleXFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = "/static/image/ui/anados-area-name.png";

    img.onload = () => {
      const baseHeight = scale(22);
      // 背景
      const backgroundImage = new Konva.Image({
        image: img,
        x: 0,
        y: baseHeight,
        width: scale(img.width),
        height: scale(img.height),
      });
      layer.add(backgroundImage);
      // エリア名
      const areaText = new Konva.Text({
        text: areaName,
        x: scale(65),
        y: baseHeight + scale(26),
        fontSize: scale(34),
        fontStyle: "700",
        fontFamily: "Noto Serif JP",
        align: "left",
        fill: "#FFFFFF",
        stroke: "#000000",
        strokeWidth: scale(5),
        fillAfterStrokeEnabled: true,
      });
      layer.add(areaText);
      resolve();
    };
  });
}

export type UiMode = "normal" | "face" | "noface";

function getControlUiPath(mode: UiMode): string {
  switch (mode) {
    case "normal":
      return "/static/image/ui/anados-icon-nav.png";
    case "face":
      return "/static/image/ui/anados-icon-nav-face.png";
    case "noface":
      return "/static/image/ui/anados-icon-nav-noface.png";
  }
}

export function addControlUi(
  layer: Konva.Layer,
  mode: UiMode,
  align: "right" | "left"
): Promise<void> {
  const scale = applyScaleXFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getControlUiPath(mode);

    img.onload = () => {
      // 背景
      const controlImage = new Konva.Image({
        image: img,
        x:
          align === "right"
            ? layer.width() - scale(img.width) - scale(50)
            : scale(20),
        y: scale(30),
        width: scale(img.width),
        height: scale(img.height),
      });
      layer.add(controlImage);
      resolve();
    };
  });
}

function addWatermark(layer: Konva.Layer, deep?: boolean): Promise<void> {
  const scale = applyScaleXFunc(layer);
  return new Promise((resolve) => {
    const img = new Image();
    img.src = "/static/image/ui/anados-gen-credit.svg";

    img.onload = () => {
      const creditImage = new Konva.Image({
        image: img,
        x: layer.width() - scale(640),
        y: layer.height() - scale(100),
        width: scale(640),
        height: scale(100),
        opacity: deep ? 0.3 : 0.2,
      });
      layer.add(creditImage);
      resolve();
    };
  });
}
