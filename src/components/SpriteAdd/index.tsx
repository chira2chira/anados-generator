import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { Button, Card, Checkbox, FormGroup } from "@blueprintjs/core";
import Konva from "konva";
import useThrottle from "@/hooks/useThrottle";
import { addAdditionalImage } from "@/utils/talkCanvasUtil";
import type { SpriteInfo } from "@/utils/loadSprite";
import { css } from "@emotion/react";

// https://jfly.uni-koeln.de/colorset/
const COLOR_SET = [
  // "#FF4B00",
  // "#03AF7A",
  // "#005AFF",
  "#4DC4FF",
  "#FFF100",
  "#990099",
  "#804000",
];

function getAnchorColor(num: number) {
  return COLOR_SET[num % COLOR_SET.length];
}

function paddingZero(num: Number) {
  return ("00" + num).slice(-2);
}

function SpriteAdd(props: {
  stage: Konva.Stage;
  uniqueId: number;
  spriteInfo: SpriteInfo[];
  onRemove: (uniqueId: number) => void;
  onLayerUp: (uniqueId: number, layer: Konva.Layer) => void;
  onLayerDown: (uniqueId: number, layer: Konva.Layer) => void;
}) {
  const { stage, uniqueId, spriteInfo } = props;

  const { t, i18n } = useTranslation("common");
  const [spriteId, setSpriteId] = useState(spriteInfo[0].id);
  const [skinIndex, setSkinInfex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [darker, setDarker] = useState(false);
  const [attr, setAttr] = useState({ x: 0, y: 0, rotation: 0, scale: 1 });
  const throttledAttr = useThrottle(attr, 100);
  const layerRef = useRef<Konva.Layer>();
  const imageRef = useRef<Konva.Image>();

  // 初期化とクリーンアップ
  useEffect(() => {
    const layer = new Konva.Layer();
    stage.add(layer);
    layer.moveDown(); // UIより1階層下
    layerRef.current = layer;

    return () => {
      layerRef.current?.destroy();
    };
  }, [stage]);

  useEffect(() => {
    const layer = layerRef.current;
    if (layer === undefined) return;

    layer.destroyChildren();
    const filePath = spriteInfo.find((x) => x.id === spriteId)?.skins[skinIndex]
      .files[fileIndex];
    if (!filePath) return;

    (async () => {
      const oldPosition = imageRef.current?.position();
      const oldRotation = imageRef.current?.rotation();
      const oldScale = imageRef.current?.scale();
      const image = await addAdditionalImage(
        layer,
        `/static/image/sprite/${spriteId}/${filePath}`,
        getAnchorColor(uniqueId),
        handleTransform
      );
      imageRef.current = image;

      // 位置とか復元
      if (
        oldPosition !== undefined &&
        oldRotation !== undefined &&
        oldScale !== undefined
      ) {
        image.position(oldPosition);
        image.rotation(oldRotation);
        image.scale(oldScale);
      }
      setDarker(false);
    })();
  }, [fileIndex, skinIndex, spriteId, spriteInfo, uniqueId]);

  const handleChangeSprite: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    setSpriteId(e.currentTarget.value);
    setSkinInfex(0);
    setFileIndex(0);
  };

  const handleChangeSkin: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const index = Number(e.currentTarget.value);
    setSkinInfex(index);
    if (
      spriteInfo.find((x) => x.id === spriteId)!.skins[index].files.length <
      fileIndex
    ) {
      setFileIndex(0);
    }
  };

  const handleChangeFile: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const index = Number(e.currentTarget.value);
    setFileIndex(index);
  };

  const handleChangeDarker = () => {
    if (darker === false) {
      imageRef.current?.value(-1);
    } else {
      imageRef.current?.value(0);
    }
    setDarker(!darker);
  };

  const handleTransform = (evt: Konva.KonvaEventObject<Konva.Transformer>) => {
    const { attrs } = evt.target;
    setAttr((current) => ({
      x: Math.round(attrs.x),
      y: Math.round(attrs.y),
      rotation: Math.round(attrs.rotation * 10) / 10,
      scale:
        attrs.width !== undefined // ドラッグにはscale情報がない
          ? Math.round(attrs.scaleX * 1000) / 1000
          : current.scale,
    }));
  };

  const handleClickReset = () => {
    imageRef.current?.position({ x: 0, y: 0 });
    imageRef.current?.rotation(0);
    imageRef.current?.scale({ x: 1, y: 1 });
    setAttr({ x: 0, y: 0, rotation: 0, scale: 1 });
  };

  const handleClose = () => {
    props.onRemove(uniqueId);
  };

  const handleLayerUp = () => {
    props.onLayerUp(uniqueId, layerRef.current!);
  };

  const handleLayerDown = () => {
    props.onLayerDown(uniqueId, layerRef.current!);
  };

  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        align-items: center;
      `}
    >
      <Card
        css={css`
          position: relative;
          flex-grow: 1;
        `}
      >
        <Button
          css={css`
            position: absolute;
            top: 0;
            right: 0;
          `}
          icon="cross"
          intent="danger"
          onClick={handleClose}
          minimal
        />
        <FormGroup
          label={
            <div
              css={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
              `}
            >
              <div>
                <span style={{ color: getAnchorColor(uniqueId) }}>◆</span>
                {t("ui.text.additionalSprite")}
              </div>
              <div
                css={css`
                  display: flex;
                  gap: 5px;
                  line-height: 0.9em;
                  font-size: 0.7em;
                  color: #5f6b7c;
                `}
              >
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <AttrInfo name="x" value={throttledAttr.x} />
                  <AttrInfo name="y" value={throttledAttr.y} />
                </div>
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <AttrInfo name="rotation" value={throttledAttr.rotation} />
                  <AttrInfo name="scale" value={throttledAttr.scale} />
                </div>
              </div>
            </div>
          }
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 5px;
            `}
          >
            <div className="bp5-html-select">
              <select onChange={handleChangeSprite}>
                {spriteInfo.map((x) => (
                  <option key={x.id} value={x.id}>
                    {i18n.language === "ja"
                      ? `[${x.sortIndex}] ${x.nameJa}`
                      : x.nameEn}
                  </option>
                ))}
              </select>
              <span className="bp5-icon bp5-icon-chevron-down"></span>
            </div>
            <div
              css={css`
                display: flex;
                gap: 5px;
              `}
            >
              <div className="bp5-html-select">
                <select onChange={handleChangeSkin} value={skinIndex}>
                  {spriteInfo
                    .find((x) => x.id === spriteId)
                    ?.skins.map((y) => (
                      <option key={y.index} value={y.index}>
                        {t("ui.text.spriteSkin")}
                        {paddingZero(y.index + 1)}
                      </option>
                    ))}
                </select>
                <span className="bp5-icon bp5-icon-chevron-down"></span>
              </div>
              <div className="bp5-html-select">
                <select onChange={handleChangeFile} value={fileIndex}>
                  {spriteInfo
                    .find((x) => x.id === spriteId)
                    ?.skins[skinIndex].files.map((y, i) => (
                      <option key={y} value={i}>
                        {t("ui.text.spriteFace")}
                        {paddingZero(i + 1)}
                      </option>
                    ))}
                </select>
                <span className="bp5-icon bp5-icon-chevron-down"></span>
              </div>
            </div>
          </div>
        </FormGroup>
        <div
          css={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
          `}
        >
          <Checkbox
            css={css`
              margin: 0;
            `}
            checked={darker}
            onChange={handleChangeDarker}
          >
            {t("ui.text.dimSwitch")}
          </Checkbox>
          <Button
            icon="reset"
            intent="warning"
            small
            onClick={handleClickReset}
          >
            {t("ui.button.resetTransform")}
          </Button>
        </div>
      </Card>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 5px;
        `}
      >
        <Button icon="chevron-up" minimal small onClick={handleLayerUp} />
        <Button icon="chevron-down" minimal small onClick={handleLayerDown} />
      </div>
    </div>
  );
}

type AttrInfoProps = {
  name: string;
  value: number;
};

const AttrInfo: React.FC<AttrInfoProps> = ({ name, value }) => {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        gap: 3px;
      `}
    >
      <span>{name}:</span>
      <span>{value}</span>
    </div>
  );
};

export default memo(SpriteAdd);
