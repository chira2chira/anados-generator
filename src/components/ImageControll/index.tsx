import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { Button, Checkbox, Label, Slider } from "@blueprintjs/core";
import Konva from "konva";
import { css } from "@emotion/react";

export default function ImageControll(props: {
  imageRef: React.MutableRefObject<Konva.Image | undefined>;
  initializeKey: string;
  onReset: () => void;
}) {
  const { imageRef, initializeKey } = props;
  const { t } = useTranslation("common");
  const [darker, setDarker] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    setDarker(false);
    setOpacity(1);
  }, [initializeKey]);

  const handleChangeDarker = () => {
    if (darker === false) {
      imageRef.current?.value(-1);
    } else {
      imageRef.current?.value(0);
    }
    setDarker(!darker);
  };

  const handleChangeOpacity = (value: number) => {
    imageRef.current?.opacity(value / 100);
    setOpacity(value / 100);
  };

  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
      `}
    >
      <Label>
        {t("ui.text.opacity")}
        <Slider
          css={css`
            touch-action: pan-y;
          `}
          value={opacity * 100}
          max={100}
          labelStepSize={20}
          onChange={handleChangeOpacity}
        />
      </Label>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 5px;
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
        <Button icon="reset" intent="warning" small onClick={props.onReset}>
          {t("ui.button.resetTransform")}
        </Button>
      </div>
    </div>
  );
}
