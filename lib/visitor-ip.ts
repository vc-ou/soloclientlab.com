const DEFAULT_IGNORED_IPS = ["127.0.0.1", "::1", "localhost"];

function normalizeIp(value?: string | null) {
  if (!value) return "";
  const firstValue = value.split(",")[0]?.trim() ?? "";

  if (firstValue.startsWith("[") && firstValue.includes("]")) {
    return firstValue.slice(1, firstValue.indexOf("]"));
  }

  const withoutIpv4Prefix = firstValue.replace(/^::ffff:/i, "");
  const portSeparatorCount = (withoutIpv4Prefix.match(/:/g) ?? []).length;

  if (portSeparatorCount === 1) {
    return withoutIpv4Prefix.split(":")[0] ?? "";
  }

  return withoutIpv4Prefix;
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return undefined;
  }

  return parts.reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
}

function matchesIpv4Cidr(ip: string, rule: string) {
  const [network, prefixValue] = rule.split("/");
  const prefix = Number(prefixValue);
  const ipNumber = ipv4ToNumber(ip);
  const networkNumber = ipv4ToNumber(network ?? "");

  if (ipNumber === undefined || networkNumber === undefined || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (networkNumber & mask);
}

export function getVisitorIp(headers: Headers) {
  const forwardedIp = normalizeIp(
    headers.get("x-forwarded-for") ??
      headers.get("x-real-ip") ??
      headers.get("cf-connecting-ip") ??
      headers.get("x-client-ip")
  );

  if (forwardedIp) {
    return forwardedIp;
  }

  const host = headers.get("host") ?? "";
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return "localhost";
  }

  return "";
}

export function getIgnoredIpRules() {
  const configuredRules = (process.env.UMAMI_IGNORE_IPS ?? "")
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean);

  return [...DEFAULT_IGNORED_IPS, ...configuredRules];
}

export function isIgnoredVisitorIp(ip: string, rules = getIgnoredIpRules()) {
  const normalizedIp = normalizeIp(ip);
  if (!normalizedIp) return false;

  return rules.some((rule) => {
    const normalizedRule = normalizeIp(rule);
    if (!normalizedRule) return false;
    if (normalizedRule.includes("/")) {
      return matchesIpv4Cidr(normalizedIp, normalizedRule);
    }

    return normalizedIp === normalizedRule;
  });
}
