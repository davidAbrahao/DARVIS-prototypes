import type { ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    keyIdx += 1;
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyIdx} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={keyIdx} className="italic text-ink-secondary">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyIdx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-track text-accent-text"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

interface MarkdownTextProps {
  content: string;
}

export function MarkdownText({ content }: MarkdownTextProps) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let listItems: { ordered: boolean; items: string[] } | null = null;
  let keyCounter = 0;

  const flushList = () => {
    if (!listItems) return;
    keyCounter += 1;
    if (listItems.ordered) {
      elements.push(
        <ol key={`list-${keyCounter}`} className="list-decimal pl-5 space-y-1.5 my-2">
          {listItems.items.map((item, idx) => (
            <li key={idx} className="text-ink-secondary">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`list-${keyCounter}`} className="list-disc pl-5 space-y-1.5 my-2">
          {listItems.items.map((item, idx) => (
            <li key={idx} className="text-ink-secondary">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    }
    listItems = null;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushList();
      keyCounter += 1;
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      elements.push(
        <p
          key={`h-${keyCounter}`}
          className={`font-display font-semibold text-ink mt-3 mb-1 ${
            level === 1 ? 'text-base' : 'text-sm'
          }`}
        >
          {renderInline(headingText)}
        </p>
      );
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unorderedMatch) {
      if (!listItems || listItems.ordered) {
        flushList();
        listItems = { ordered: false, items: [] };
      }
      listItems.items.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      if (!listItems || !listItems.ordered) {
        flushList();
        listItems = { ordered: true, items: [] };
      }
      listItems.items.push(orderedMatch[1]);
      continue;
    }

    flushList();
    keyCounter += 1;
    elements.push(
      <p key={`p-${keyCounter}`} className="my-1.5 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
