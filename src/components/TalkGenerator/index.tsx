import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import * as styles from "@/styles/Home.module";
import {
  Button,
  Checkbox,
  FileInput,
  FormGroup,
  InputGroup,
  Radio,
  RadioGroup,
  TextArea,
} from "@blueprintjs/core";
import { css } from "@emotion/react";
import Konva from "konva";
import { useFile } from "@/hooks/useFile";
import {
  addAreaName,
  addControlUi,
  addStillWindow,
  addTalkWindow,
} from "@/utils/talkCanvasUtil";
import { sendEvent } from "@/utils/gtag";
import type { SpriteInfo } from "@/utils/loadSprite";
import ImageAdd from "../ImageAdd";
import SpriteAdd from "../SpriteAdd";
import RubyModal from "../RubyModal";

const CANVAS_ID = "canvas-container";

type InputValues = {
  charName: string;
  text: string;
  areaName: string;
};

type TalkGeneratorProps = {
  spriteInfo: SpriteInfo[];
};

type AdditionalType = "image" | "sprite";
type AdditionalIndex = {
  type: AdditionalType;
  id: number;
};

const TalkGenerator: React.FC<TalkGeneratorProps> = (props) => {
  const { t } = useTranslation("common");
  const { handleFiles, imageBase64, fileName } = useFile();
  const [bgImage, setBgImage] = useState("");
  const [uiMode, setUiMode] = useState("normal");
  const [text, setText] = useState(t("ui.inputValue.talkText"));
  const [bigText, setBigText] = useState(false);
  const [charName, setCharName] = useState(t("ui.inputValue.charName"));
  const [areaName, setAreaName] = useState(t("ui.inputValue.areaName"));
  const [displayAreaRegion, setDisplayAreaRegion] = useState("show");
  const [inputValues, setInputValues] = useState<InputValues>({
    charName,
    text,
    areaName,
  });
  const [rubyIndex, setRubyIndex] = useState(0);
  const [rubyModalOpen, setRubyModalOpen] = useState(false);
  const [additionalArr, setAdditionalArr] = useState<AdditionalIndex[]>([]);
  const stageRef = useRef<Konva.Stage>();
  const bgLayerRef = useRef<Konva.Layer>();
  const uiLayerRef = useRef<Konva.Layer>();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // DOMを待ってから初期化
    const newStage = new Konva.Stage({ container: CANVAS_ID });
    const newLayer1 = new Konva.Layer({ listening: false });
    const newLayer2 = new Konva.Layer({ listening: false });
    newStage.add(newLayer1);
    newStage.add(newLayer2);
    stageRef.current = newStage;
    bgLayerRef.current = newLayer1;
    uiLayerRef.current = newLayer2;
  }, []);

  // 背景描画
  useEffect(() => {
    const stage = stageRef.current;
    const bgLayer = bgLayerRef.current;
    bgLayer?.destroyChildren();
    stage?.width(1);
    stage?.height(1);

    if (imageBase64 === "") {
      setBgImage("");
    }

    if (stage === undefined || bgLayer === undefined || imageBase64 === "")
      return;

    const img = new Image();
    img.src = imageBase64;

    img.onload = async () => {
      // 最大長を1920に制限する
      const longSide = img.width > img.height ? img.width : img.height;
      const imageWidth =
        longSide > 1920 ? (1920 / longSide) * img.width : img.width;
      const imageHeight =
        longSide > 1920 ? (1920 / longSide) * img.height : img.height;

      const backgroundImage = new Konva.Image({
        image: img,
        x: 0,
        y: 0,
        width: imageWidth,
        height: imageHeight,
      });

      stage.width(imageWidth);
      stage.height(imageHeight);
      if (imageWidth > document.documentElement.clientWidth) {
        stage.scale({
          x: document.documentElement.clientWidth / imageWidth,
          y: document.documentElement.clientWidth / imageWidth,
        });
      }
      bgLayer.add(backgroundImage);

      // UI描画Kick
      setBgImage(imageBase64);
    };
  }, [imageBase64]);

  // UI描画
  useEffect(() => {
    (async () => {
      const uiLayer = uiLayerRef.current;
      uiLayer?.destroyChildren();

      if (
        stageRef.current === undefined ||
        uiLayer === undefined ||
        bgImage === ""
      )
        return;

      if (uiMode === "normal") {
        await addTalkWindow(
          uiLayer,
          inputValues.charName,
          inputValues.text,
          bigText
        );
      } else {
        await addStillWindow(
          uiLayer,
          inputValues.charName,
          inputValues.text,
          bigText
        );
      }
      if (displayAreaRegion === "show") {
        await addAreaName(uiLayer, inputValues.areaName);
      }
      await addControlUi(
        uiLayer,
        uiMode === "normal" ? "normal" : "face",
        displayAreaRegion === "ui" ? "left" : "right"
      );
    })();
  }, [inputValues, uiMode, displayAreaRegion, bigText, bgImage]);

  const handleAdditionalAdd = (type: AdditionalType) => {
    if (additionalArr.length === 0) {
      setAdditionalArr([{ type, id: 0 }]);
    } else {
      setAdditionalArr([
        ...additionalArr,
        {
          type,
          id:
            // 最大値+1
            Math.max.apply(
              null,
              additionalArr.map((x) => x.id)
            ) + 1,
        },
      ]);
    }
  };

  const handleImageAdd = () => {
    handleAdditionalAdd("image");
  };

  const handleSpriteAdd = () => {
    handleAdditionalAdd("sprite");
  };

  const handleAddRuby = () => {
    const textArea = textRef.current;
    if (textArea === null) return;

    setRubyIndex(textArea.selectionStart);
    setRubyModalOpen(true);
  };

  const handleRubyConfirm = (base: string, ruby: string) => {
    setRubyModalOpen(false);

    const newText =
      text.substring(0, rubyIndex) +
      "[#" +
      base +
      "," +
      ruby +
      "]" +
      text.substring(rubyIndex, text.length);

    setText(newText);
    setInputValues({ ...inputValues, text: newText });
    textRef.current?.focus();
  };

  const handeAdditionalRemove = useCallback(
    (index: number) => {
      setAdditionalArr(additionalArr.filter((x) => x.id !== index));
    },
    [additionalArr]
  );

  const handleDownload = async () => {
    const stage = stageRef.current;
    if (stage === undefined) return;

    const currentScale = stage.scale();
    const transformers: Konva.Transformer[] = stage.find("Transformer");
    transformers.forEach((x) => x.hide());
    stage.scale({ x: 1, y: 1 });
    const dataUrl = stage.toDataURL();
    stage.scale(currentScale);
    transformers.forEach((x) => x.show());
    const link = document.createElement("a");
    link.href = dataUrl;
    link.setAttribute("download", "anadosgen_" + new Date().getTime() + ".png");
    link.click();

    sendEvent({
      action: "download",
      category: "canvas",
      label: uiMode,
    });
  };

  return (
    <>
      <div css={styles.controlBox}>
        <FormGroup label={t("ui.text.bgImage")}>
          <FileInput
            css={css`
              width: 100%;
            `}
            text={fileName || t("ui.inputValue.chooseBgImage")}
            buttonText={t("ui.button.browse")}
            onInputChange={handleFiles}
            inputProps={{ accept: "image/*" }}
          />
        </FormGroup>

        <FormGroup label={t("ui.text.talkType")}>
          <RadioGroup
            inline
            selectedValue={uiMode}
            onChange={(e) => setUiMode(e.currentTarget.value)}
          >
            <Radio label={t("ui.radio.talk.normal")} value="normal" />
            <Radio label={t("ui.radio.talk.still")} value="still" />
          </RadioGroup>
        </FormGroup>

        <FormGroup label={t("ui.text.charName")} labelFor="char-name">
          <InputGroup
            id="char-name"
            style={{ fontFamily: "Noto Serif JP", fontWeight: "500" }}
            value={charName}
            onChange={(e) => setCharName(e.currentTarget.value)}
            onBlur={() => setInputValues({ ...inputValues, charName })}
          />
        </FormGroup>

        <FormGroup label={t("ui.text.telkText")} labelFor="main-text">
          <div
            css={css`
              margin: 0 0 7px !important;
              display: flex;
              align-items: center;
              gap: 10px;
            `}
          >
            <Checkbox checked={bigText} onChange={() => setBigText(!bigText)}>
              {t("ui.text.bigText")}
            </Checkbox>
            <Button onClick={handleAddRuby} small>
              {t("ui.button.addRubyText")}
            </Button>
          </div>
          <TextArea
            inputRef={textRef}
            id="main-text"
            style={{
              fontFamily: "Noto Serif JP",
              fontWeight: uiMode === "normal" ? "700" : "500",
              width: "100%",
            }}
            rows={uiMode === "normal" ? 3 : 2}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            onBlur={() => setInputValues({ ...inputValues, text })}
          />
        </FormGroup>

        <FormGroup label={t("ui.text.areaName")}>
          <RadioGroup
            inline
            selectedValue={displayAreaRegion}
            onChange={(e) => setDisplayAreaRegion(e.currentTarget.value)}
          >
            <Radio label={t("ui.radio.area.show")} value="show" />
            <Radio label={t("ui.radio.area.hide")} value="hide" />
            <Radio label={t("ui.radio.area.ui")} value="ui" />
          </RadioGroup>

          <InputGroup
            style={{ fontFamily: "Noto Serif JP", fontWeight: "700" }}
            disabled={displayAreaRegion !== "show"}
            value={areaName}
            onChange={(e) => setAreaName(e.currentTarget.value)}
            onBlur={() => setInputValues({ ...inputValues, areaName })}
          />
        </FormGroup>

        {stageRef.current && (
          <>
            <div
              css={css`
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                gap: 10px;
              `}
            >
              {additionalArr.map((x) => (
                <Fragment key={x.id}>
                  {x.type === "image" ? (
                    <ImageAdd
                      stage={stageRef.current!}
                      uniqueId={x.id}
                      onRemove={handeAdditionalRemove}
                    />
                  ) : (
                    <SpriteAdd
                      stage={stageRef.current!}
                      uniqueId={x.id}
                      spriteInfo={props.spriteInfo}
                      onRemove={handeAdditionalRemove}
                    />
                  )}
                </Fragment>
              ))}
              <Button onClick={handleImageAdd} icon="add">
                {t("ui.button.addAdditionalImage")}
              </Button>
              <Button onClick={handleSpriteAdd} icon="add">
                {t("ui.button.addAdditionalSprite")}
              </Button>
            </div>
          </>
        )}
      </div>
      <div
        id={CANVAS_ID}
        style={{ maxWidth: "100%", marginBottom: "10px" }}
      ></div>
      <div>
        <Button
          onClick={handleDownload}
          intent="primary"
          icon="download"
          large
          disabled={!fileName}
        >
          {t("ui.button.downloadImage")}
        </Button>
      </div>

      <RubyModal
        isOpen={rubyModalOpen}
        uiMode={uiMode}
        onCancel={() => setRubyModalOpen(false)}
        onConfirm={handleRubyConfirm}
      />
    </>
  );
};

export default TalkGenerator;
