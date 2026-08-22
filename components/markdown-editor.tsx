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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const manualPath = manualArticlePath.trim();
    const selectedPost = linkablePosts.find((post) => post.slug === selectedPostSlug);
    const href = normalizeArticleHref(manualPath || (selectedPost ? `/research/${selectedPost.slug}` : ""));
    if (!href) return;

    const visualSelectionText = mode === "visual" ? (window.getSelection()?.toString().trim() ?? "") : "";
    const label = anchorText.trim() || visualSelectionText || selectedPost?.title || "related article";
    const markdownLink = `[${label}](${href})`;

    if (mode === "markdown") {
      const ta = textareaRef.current;
      if (ta) {
        const value = ta.value;
        const start = ta.selectionStart ?? value.length;
        const end = ta.selectionEnd ?? value.length;
        const before = value.slice(0, start);
        const after = value.slice(end);
        const prefix = before && !before.endsWith("\n") ? "\n\n" : "";
        const inserted = prefix + markdownLink;
        const next = before + inserted + after;
        setMarkdown(next);
        requestAnimationFrame(() => {
          ta.focus();
          const pos = (before + inserted).length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        setMarkdown((currentMarkdown) => `${currentMarkdown}${currentMarkdown ? "\n\n" : ""}${markdownLink}`);
      }
      setAnchorText("");
      setManualArticlePath("");
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
    setManualArticlePath("");
  };

  return (
    <section className="markdown-editor">
      <input type="hidden" name={name} value={markdown} />
      <div className="markdown-editor-header">
        <div>
          <span>文章内容</span>
          <small className="field-help">把排版好的内容贴在这里，会保存为 Markdown。</small>
        </div>
        <div className="markdown-editor-tabs" role="tablist" aria-label="编辑模式">
          <button
            type="button"
            className={mode === "visual" ? "is-active" : ""}
            onClick={() => setMode("visual")}
          >
            可视化
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

      <div className="markdown-link-toolbar" aria-label="插入文章链接">
        <label>
          <span>已发布文章</span>
          {linkablePosts.length ? (
            <select value={selectedPostSlug} onChange={(event) => setSelectedPostSlug(event.target.value)}>
              {linkablePosts.map((post) => (
                <option key={post.slug} value={post.slug}>
                  {post.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="field-help">暂无其他已发布文章</span>
          )}
        </label>
        <label>
          <span>或手动路径</span>
          <input
            value={manualArticlePath}
            onChange={(event) => setManualArticlePath(event.target.value)}
            placeholder="/research/slug 或 /demand-radar"
          />
        </label>
        <label>
          <span>锚文本</span>
          <input
            value={anchorText}
            onChange={(event) => setAnchorText(event.target.value)}
            placeholder="使用选中的文字或文章标题"
          />
        </label>
        <button
          type="button"
          className="button secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertArticleLink}
        >
          插入链接
        </button>
      </div>

      {mode === "visual" ? (
        <div
          ref={editorRef}
          className="markdown-editor-surface article-content"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="文章内容可视化编辑器"
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          onPaste={handlePaste}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className="markdown-editor-source"
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          rows={24}
          aria-label="文章内容 Markdown 源码"
        />
      )}
    </section>
  );
}
