import "normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import usePageView from "@/hooks/usePageView";
import GoogleAnalytics from "@/components/GoogleAnalytics";

function App({ Component, pageProps }: AppProps) {
  const { asPath } = useRouter();
  usePageView(asPath);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
      </Head>

      <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
        <GoogleAnalytics />
        <Component {...pageProps} />
      </DndProvider>
    </>
  );
}
export default appWithTranslation(App);
