import Script from "next/script";

const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
const plausibleScriptSrc = process.env.PLAUSIBLE_SCRIPT_SRC ?? "https://plausible.io/js/script.js";

export function PlausibleScript() {
  if (!plausibleDomain) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={plausibleDomain}
      src={plausibleScriptSrc}
      strategy="lazyOnload"
    />
  );
}
