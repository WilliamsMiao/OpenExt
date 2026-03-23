'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownViewerProps {
  content: string
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-emerald-300
      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
      prose-p:text-gray-300
      prose-strong:text-gray-100
      prose-code:text-emerald-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
      prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
      prose-blockquote:border-gray-600 prose-blockquote:text-gray-400
      prose-table:text-sm
      prose-th:bg-gray-800 prose-th:text-gray-200 prose-th:px-3 prose-th:py-2
      prose-td:text-gray-300 prose-td:px-3 prose-td:py-1.5
      prose-a:text-blue-400
      prose-li:text-gray-300
      prose-hr:border-gray-700
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
