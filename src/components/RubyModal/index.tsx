import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
} from "@blueprintjs/core";
import { css } from "@emotion/react";

type RubyModalProps = {
  isOpen: boolean;
  uiMode: string;
  onConfirm: (base: string, ruby: string) => void;
  onCancel: () => void;
};

export default function RubyModal(props: RubyModalProps) {
  const { t } = useTranslation("common");
  const [base, setBase] = useState("");
  const [ruby, setRuby] = useState("");

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    props.onConfirm(base, ruby);
  };

  const handleClose = () => {
    props.onCancel();
  };

  const handleClosing = () => {
    setBase("");
    setRuby("");
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={handleClose}
      onClosing={handleClosing}
      shouldReturnFocusOnClose={false}
    >
      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogBody>
          <h3>{t("ui.button.addRubyText")}</h3>

          <FormGroup label={t("ui.text.baseText")} labelFor="base-text">
            <InputGroup
              id="base-text"
              style={{
                fontFamily: "Noto Serif JP",
                fontWeight: props.uiMode === "normal" ? "700" : "500",
              }}
              required
              autoFocus
              value={base}
              onChange={(e) => setBase(e.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label={t("ui.text.rubyText")} labelFor="ruby-text">
            <InputGroup
              id="ruby-text"
              style={{
                fontFamily: "Noto Serif JP",
                fontWeight: props.uiMode === "normal" ? "700" : "500",
              }}
              required
              value={ruby}
              onChange={(e) => setRuby(e.currentTarget.value)}
            />
          </FormGroup>

          <p>{t("ui.text.rubyHelp")}</p>
        </DialogBody>

        <DialogFooter
          css={css`
            margin-top: 0;
          `}
          minimal
          actions={
            <>
              <Button minimal onClick={handleClose}>
                {t("ui.button.cancel")}
              </Button>
              <Button intent="primary" type="submit">
                OK
              </Button>
            </>
          }
        />
      </form>
    </Dialog>
  );
}
