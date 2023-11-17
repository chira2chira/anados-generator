import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import * as styles from "@/styles/Home.module";
import { css } from "@emotion/react";
import CommonMeta from "@/components/CommonMeta";
import Link from "next/link";

const TalkGenerator = dynamic(() => import("@/components/TalkGenerator"), {
  ssr: false,
});

export default function Home() {
  const { t } = useTranslation("common");
  const { asPath, locale, push } = useRouter();

  const handleChangeLocale: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    push("/" + e.currentTarget.value + asPath, undefined, {
      locale: e.currentTarget.value,
    });
  };

  return (
    <>
      <CommonMeta cardType="summary" />

      <div
        css={css`
          display: flex;
          padding: 3px 10px 0;
          gap: 13px;
          font-size: 90%;
        `}
      >
        <Link href={"https://anados-collection-tracker.vercel.app/"}>
          {t("ui.link.checker")}
        </Link>
        <Link
          href={"https://anados-collection-tracker.vercel.app/gacha/simulator"}
        >
          {t("ui.link.gachasimu")}
        </Link>
        <Link href={"/"}>{t("ui.link.generator")}</Link>
      </div>

      <div
        css={css`
          position: relative;
        `}
      >
        <header css={styles.header}>
          <h1 css={styles.title}>{t("title")}</h1>
        </header>

        <main css={styles.main}>
          <TalkGenerator />
        </main>

        <footer
          css={css`
            margin-bottom: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          `}
        >
          <div>
            {t("ui.text.hashtag")}:{" "}
            <a
              href="https://twitter.com/search?q=%23%E3%82%A2%E3%83%8A%E3%83%89%E3%82%B9%E4%BC%9A%E8%A9%B1%E3%82%B8%E3%82%A7%E3%83%8D%E3%83%AC%E3%83%BC%E3%82%BF%E3%83%BC"
              target="_blank"
            >
              #アナドス会話ジェネレーター
            </a>
          </div>
          <div>
            {t("ui.text.author")}: チラツキ{" "}
            <a href="https://twitter.com/chira2chira">Twitter</a>{" "}
            <a href="https://www.youtube.com/@chira2chira">YouTube</a>
          </div>
        </footer>

        <div
          className="bp5-html-select"
          css={css`
            position: absolute;
            top: 10px;
            left: 10px;
          `}
        >
          <select value={locale} onChange={handleChangeLocale}>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
          <span className="bp5-icon bp5-icon-translate"></span>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale!, ["common"])),
    },
  };
};
