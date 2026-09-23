import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string; // Additional classes (like text size or prose color)
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-lg prose-blue max-w-none text-gray-700 font-medium leading-relaxed prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => (
            // Markdown images have varying intrinsic dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt || ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full h-auto" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto" role="region" aria-label="Article table" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
