import "i18next";
import common from "./public/locales/ja/common.json";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: "common";
    // custom resources type
    resources: {
      common: typeof common;
    };
    // other
  }
}