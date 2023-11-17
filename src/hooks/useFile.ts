import { ChangeEventHandler, FormEventHandler, useState } from "react";

// https://qiita.com/FumioNonaka/items/4f0fc65975eed5b89c0c
export const useFile = () => {
  const [imageBase64, setImageBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFiles: FormEventHandler<HTMLInputElement> = (event) => {
    setImageBase64("");
    setFileName("");
    const files = event.currentTarget.files;

    if (!files || files?.length === 0) return;
    const file = files[0];
    if (!file.type.includes("image/")) {
      event.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result !== "string") {
        setImageBase64("");
      } else {
        setImageBase64(e.target.result);
        setFileName(file.name);
      }
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };
  return { handleFiles, imageBase64, fileName };
};
