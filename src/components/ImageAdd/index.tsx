import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import {
  Button,
  Card,
  Checkbox,
  FileInput,
  FormGroup,
} from "@blueprintjs/core";
import Konva from "konva";
import { useFile } from "@/hooks/useFile";
import { addAdditionalImage } from "@/utils/talkCanvasUtil";
import { css } from "@emotion/react";

// https://jfly.uni-koeln.de/colorset/
const COLOR_SET = [
  "#FF4B00",
  "#03AF7A",
  "#005AFF",
  "#4DC4FF",
  "#FFF100",
  "#990099",
  "#804000",
];

function getAnchorColor(num: number) {
  return COLOR_SET[num % COLOR_SET.length];
}

function ImageAdd(props: {
  stage: Konva.Stage;
  uniqueId: number;
  onRemove: (uniqueId: number) => void;
}) {
  const { stage, uniqueId } = props;

  const { t } = useTranslation("common");
  const { handleFiles, imageBase64, fileName } = useFile();
  const [darker, setDarker] = useState(false);
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
    if (imageBase64 === "") return;

    (async () => {
      const oldPosition = imageRef.current?.position();
      const oldRotation = imageRef.current?.rotation();
      const oldScale = imageRef.current?.scale();
      const image = await addAdditionalImage(
        layer,
        imageBase64,
        getAnchorColor(uniqueId)
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
  }, [imageBase64, uniqueId]);

  const handleChangeDarker = () => {
    if (darker === false) {
      imageRef.current?.value(-1);
    } else {
      imageRef.current?.value(0);
    }
    setDarker(!darker);
  };

  const handleClickReset = () => {
    imageRef.current?.position({ x: 0, y: 0 });
    imageRef.current?.rotation(0);
    imageRef.current?.scale({ x: 1, y: 1 });
  };

  const handleClose = () => {
    props.onRemove(uniqueId);
  };

  return (
    <Card
      css={css`
        position: relative;
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
          <>
            <span style={{ color: getAnchorColor(uniqueId) }}>◆</span>
            {t("ui.text.additionalImage")}
          </>
        }
      >
        <FileInput
          css={css`
            width: 100%;
          `}
          text={fileName || t("ui.inputValue.chooseAddImage")}
          buttonText={t("ui.button.browse")}
          onInputChange={handleFiles}
          inputProps={{ accept: "image/*" }}
        />
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
        <Button icon="reset" intent="warning" small onClick={handleClickReset}>
          {t("ui.button.resetTransform")}
        </Button>
      </div>
    </Card>
  );
}

export default memo(ImageAdd);
