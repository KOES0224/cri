import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "@/i18n/link";
import type { Element } from "hast";

interface MarkdownRendererProps {
  content: string;
  className?: string; // Additional classes (like text size or prose color)
}

// A paragraph that holds nothing but one image is rendered as a <figure>, so it must not stay a <p>.
function isImageOnly(node: Element | undefined) {
  const children = (node?.children ?? []).filter((child) => !(child.type === "text" && !child.value.trim()));
  return children.length === 1 && children[0].type === "element" && children[0].tagName === "img";
}

const components: Components = {
  p: ({ node, children }) => (isImageOnly(node) ? <>{children}</> : <p>{children}</p>),
  img: ({ src, alt, title }) => (
    // Markdown images have varying intrinsic dimensions. The Markdown title becomes the caption.
    // no-referrer: older posts may still point at postfiles.pstatic.net, which returns 403 when a Referer is sent.
    <figure className="my-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={typeof src === "string" ? src : undefined} alt={alt || ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full h-auto my-0" />
      {title && <figcaption className="mt-3 text-center text-sm text-gray-500 font-normal leading-snug">{title}</figcaption>}
    </figure>
  ),
  a: ({ href, children }) =>
    href?.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto" role="region" aria-label="Article table" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
};

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 prose-h2:mt-12 prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-sm prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/60 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-gray-800 prose-th:bg-gray-50 prose-strong:text-gray-900 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
