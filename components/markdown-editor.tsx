"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent } from "react";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function createArticleLinkElement(label: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  return link;
}

function normalizeArticleHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || /^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `/research/${trimmed}`;
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unorderedListItem = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedListItem) {
      flushParagraph();
      list.push(unorderedListItem[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks.join("");
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const childText = Array.from(element.childNodes).map(inlineNodeToMarkdown).join("");

  if (tagName === "strong" || tagName === "b") return `**${childText}**`;
  if (tagName === "em" || tagName === "i") return `*${childText}*`;
  if (tagName === "code") return `\`${childText}\``;
  if (tagName === "br") return "\n";
  if (tagName === "a") {
    const href = element.getAttribute("href");
    return href ? `[${childText}](${href})` : childText;
  }

  return childText;
}

function blockNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.trim() ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "script" || tagName === "style") return "";
  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName.replace("h", ""));
    return `${"#".repeat(level)} ${inlineNodeToMarkdown(element).trim()}`;
  }

  if (tagName === "ul") {
    return Array.from(element.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((child) => `- ${inlineNodeToMarkdown(child).trim()}`)
      .join("\n");
  }

  if (tagName === "ol") {
    return Array.from(element.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((child, index) => `${index + 1}. ${inlineNodeToMarkdown(child).trim()}`)
      .join("\n");
  }

  if (tagName === "blockquote") {
    return inlineNodeToMarkdown(element)
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  if (tagName === "pre") {
    return `\`\`\`\n${element.textContent?.trim() ?? ""}\n\`\`\``;
  }

  if (tagName === "p") {
    return inlineNodeToMarkdown(element).trim();
  }

  if (tagName === "div" || tagName === "section" || tagName === "article") {
    const blockChildren = Array.from(element.childNodes)
      .map(blockNodeToMarkdown)
      .filter(Boolean);

    if (blockChildren.length) {
      return blockChildren.join("\n\n");
    }
  }

  return inlineNodeToMarkdown(element).trim();
}

function htmlToMarkdown(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return Array.from(doc.body.childNodes)
    .map(blockNodeToMarkdown)
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function MarkdownEditor({
  name,
  initialValue,
  linkablePosts = []
}: {
  name: string;
  initialValue: string;
  linkablePosts?: { title: string; slug: string }[];
}) {
  const [markdown, setMarkdown] = useState(initialValue);
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const [selectedPostSlug, setSelectedPostSlug] = useState(linkablePosts[0]?.slug ?? "");
  const [manualArticlePath, setManualArticlePath] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(markdown);
    }
  }, [mode]);

  const syncFromEditor = () => {
    if (!editorRef.current) return;
    setMarkdown(htmlToMarkdown(editorRef.current.innerHTML));
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const pastedMarkdown = html ? htmlToMarkdown(html) : text;

    if (!pastedMarkdown) return;

    event.preventDefault();
    document.execCommand("insertHTML", false, markdownToHtml(pastedMarkdown));
    syncFromEditor();
  };

  const insertArticleLink = () => {
    const selectedPost = linkablePosts.find((post) => post.slug === selectedPostSlug);
    const href = normalizeArticleHref(selectedPost ? `/research/${selectedPost.slug}` : manualArticlePath);
    if (!href) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const label = anchorText.trim() || selectedText || selectedPost?.title || "related article";
    const markdownLink = `[${label}](${href})`;

    if (mode === "markdown") {
      setMarkdown((currentMarkdown) => `${currentMarkdown}${currentMarkdown ? "\n\n" : ""}${markdownLink}`);
      setAnchorText("");
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();
    const currentSelection = window.getSelection();
    const range = currentSelection?.rangeCount ? currentSelection.getRangeAt(0) : null;
    const editorContainsSelection = range ? editorRef.current.contains(range.commonAncestorContainer) : false;

    if (range && editorContainsSelection) {
      range.deleteContents();
      range.insertNode(createArticleLinkElement(label, href));
      range.collapse(false);
      currentSelection?.removeAllRanges();
      currentSelection?.addRange(range);
    } else {
      editorRef.current.append(" ");
      editorRef.current.append(createArticleLinkElement(label, href));
    }

    syncFromEditor();
    setAnchorText("");
  };

  return (
    <section className="markdown-editor">
      <input type="hidden" name={name} value={markdown} />
      <div className="markdown-editor-header">
        <div>
          <span>Article content</span>
          <small className="field-help">Paste formatted content here. It will be saved as Markdown.</small>
        </div>
        <div className="markdown-editor-tabs" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            className={mode === "visual" ? "is-active" : ""}
            onClick={() => setMode("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            className={mode === "markdown" ? "is-active" : ""}
            onClick={() => setMode("markdown")}
          >
            Markdown
          </button>
        </div>
      </div>

      <div className="markdown-link-toolbar" aria-label="Article link insertion">
        <label>
          <span>Article link</span>
          {linkablePosts.length ? (
            <select value={selectedPostSlug} onChange={(event) => setSelectedPostSlug(event.target.value)}>
              {linkablePosts.map((post) => (
                <option key={post.slug} value={post.slug}>
                  {post.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={manualArticlePath}
              onChange={(event) => setManualArticlePath(event.target.value)}
              placeholder="/research/article-slug"
            />
          )}
        </label>
        <label>
          <span>Anchor text</span>
          <input
            value={anchorText}
            onChange={(event) => setAnchorText(event.target.value)}
            placeholder="Use selected text or article title"
          />
        </label>
        <button type="button" className="button secondary" onClick={insertArticleLink}>
          Insert link
        </button>
      </div>

      {mode === "visual" ? (
        <div
          ref={editorRef}
          className="markdown-editor-surface article-content"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Article content visual editor"
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          onPaste={handlePaste}
        />
      ) : (
        <textarea
          className="markdown-editor-source"
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          rows={24}
          aria-label="Article content Markdown source"
        />
      )}
    </section>
  );
}
