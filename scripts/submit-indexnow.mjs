import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SITE_URL = "https://www.soloclientlab.com";
const DEFAULT_ENDPOINT = "https://www.bing.com/indexnow";
const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/research",
  "/tools/leadradar"
];
const SITEWIDE_FILE_PATTERNS = [
  /^app\/layout\.tsx$/,
  /^app\/globals\.css$/,
  /^components\/site\.tsx$/,
  /^components\/header-/,
  /^components\/header-nav\.tsx$/,
  /^lib\/content\.ts$/,
  /^app\/sitemap\.ts$/,
  /^app\/robots\.ts$/
];

function parseArgs(argv) {
  const options = {
    changed: false,
    allSitemap: false,
    dryRun: false,
    base: "HEAD~1",
    head: "HEAD",
    values: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--changed") {
      options.changed = true;
    } else if (arg === "--all-sitemap") {
      options.allSitemap = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--base") {
      options.base = argv[index + 1] ?? options.base;
      index += 1;
    } else if (arg === "--head") {
      options.head = argv[index + 1] ?? options.head;
      index += 1;
    } else {
      options.values.push(arg);
    }
  }

  return options;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

function toUrl(value, siteUrl) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${siteUrl}${normalizedPath}`;
}

function unique(values) {
  return [...new Set(values)];
}

async function getIndexNowKey() {
  if (process.env.INDEXNOW_KEY) {
    return process.env.INDEXNOW_KEY.trim();
  }

  const publicDir = path.join(process.cwd(), "public");
  const candidates = (await readdir(publicDir))
    .filter((filename) => /^[a-zA-Z0-9-]{8,128}\.txt$/.test(filename))
    .sort();

  for (const filename of candidates) {
    const key = filename.replace(/\.txt$/, "");
    const content = (await readFile(path.join(publicDir, filename), "utf8")).trim();
    if (content === key) {
      return key;
    }
  }

  throw new Error("Missing IndexNow key file in public/. Expected {key}.txt with the same key as file content.");
}

function getChangedFiles(base, head) {
  const output = execFileSync("git", ["diff", "--name-only", `${base}...${head}`], {
    encoding: "utf8"
  }).trim();

  return output ? output.split("\n") : [];
}

async function fetchSitemapUrls(siteUrl) {
  const response = await fetch(`${siteUrl}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return unique([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter(Boolean));
}

async function getAllPublicUrls(siteUrl) {
  try {
    const sitemapUrls = await fetchSitemapUrls(siteUrl);
    if (sitemapUrls.length > 0) {
      return sitemapUrls;
    }
  } catch (error) {
    console.warn(`Could not read live sitemap, falling back to static paths: ${error.message}`);
  }

  return STATIC_PUBLIC_PATHS.map((publicPath) => toUrl(publicPath, siteUrl));
}

async function inferUrlsFromChangedFiles(files, siteUrl) {
  const paths = new Set();
  let needsAllPublicUrls = false;

  for (const file of files) {
    if (SITEWIDE_FILE_PATTERNS.some((pattern) => pattern.test(file))) {
      needsAllPublicUrls = true;
      continue;
    }

    if (file === "app/page.tsx") paths.add("/");
    if (file === "app/about/page.tsx") paths.add("/about");
    if (file === "app/newsletter/page.tsx") paths.add("/newsletter");
    if (file === "app/research/page.tsx") paths.add("/research");
    if (file === "app/resources/page.tsx") paths.add("/resources");
    if (file === "app/resources/client-acquisition-report/page.tsx") paths.add("/resources/client-acquisition-report");
    if (file === "app/tools/leadradar/page.tsx" || file === "components/leadradar-demo.tsx") paths.add("/tools/leadradar");
    if (file.startsWith("app/research/[slug]/") || file === "components/post-detail.tsx") needsAllPublicUrls = true;
  }

  const urls = [...paths].map((publicPath) => toUrl(publicPath, siteUrl));
  if (needsAllPublicUrls) {
    urls.push(...(await getAllPublicUrls(siteUrl)));
  }

  return unique(urls);
}

function validateUrls(urls, siteUrl) {
  const siteHost = new URL(siteUrl).host;
  const validUrls = [];

  for (const url of urls) {
    const parsed = new URL(url);
    if (parsed.host !== siteHost) {
      console.warn(`Skipping external URL: ${url}`);
      continue;
    }
    validUrls.push(parsed.toString());
  }

  return unique(validUrls);
}

async function submitUrls({ urls, key, siteUrl, dryRun }) {
  const validUrls = validateUrls(urls, siteUrl);
  const host = new URL(siteUrl).host;
  const keyLocation = `${siteUrl}/${key}.txt`;
  const payload = {
    host,
    key,
    keyLocation,
    urlList: validUrls
  };

  if (validUrls.length === 0) {
    console.log("No public URLs to submit.");
    return;
  }

  if (validUrls.length > 10000) {
    throw new Error("IndexNow supports up to 10,000 URLs per POST.");
  }

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText} ${responseText}`);
  }

  console.log(`Submitted ${validUrls.length} URL(s) to IndexNow. Response: ${response.status} ${response.statusText}`);
  for (const url of validUrls) {
    console.log(`- ${url}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const siteUrl = getSiteUrl();
  const key = await getIndexNowKey();
  let urls = [];

  if (options.allSitemap) {
    urls = await getAllPublicUrls(siteUrl);
  } else if (options.changed || options.values.length === 0) {
    const changedFiles = getChangedFiles(options.base, options.head);
    urls = await inferUrlsFromChangedFiles(changedFiles, siteUrl);
    console.log(`Detected ${changedFiles.length} changed file(s) between ${options.base} and ${options.head}.`);
  } else {
    urls = options.values.map((value) => toUrl(value, siteUrl));
  }

  await submitUrls({ urls, key, siteUrl, dryRun: options.dryRun });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
