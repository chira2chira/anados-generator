import Document, { Html, Head, Main, NextScript } from "next/document";
import i18nextConfig from "../../next-i18next.config";

class MyDocument extends Document {
  render() {
    const currentLocale =
      this.props.__NEXT_DATA__.query.locale || i18nextConfig.i18n.defaultLocale;

    return (
      <Html
        lang={Array.isArray(currentLocale) ? currentLocale[0] : currentLocale}
      >
        <Head>
          <meta name="theme-color" content="#182026" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="google-site-verification"
            content="6j7nkQOC98vV6s1KKN7f8ZX37jDye8r-PTYxirchmX8"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@200;500;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
