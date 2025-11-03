import { Fragment, ReactNode, createElement } from "react";
import type { ReactHTML } from "react";

type MarkdownPlanProps = {
  content: string;
  className?: string;
};

const INLINE_REGEX = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;

const renderInline = (text: string): ReactNode => {
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      segments.push(<strong key={`${match.index}-strong`}>{match[2]}</strong>);
    } else if (match[3]) {
      segments.push(
        <code key={`${match.index}-code`} className="rounded bg-white/10 px-1 py-[1px] text-xs">
          {match[3]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  if (segments.length === 0) {
    return text;
  }

  return segments.map((segment, index) => <Fragment key={index}>{segment}</Fragment>);
};

const normalizeLine = (line: string): string => line.replace(/\s+$/, "");

export function MarkdownPlan({ content, className }: MarkdownPlanProps) {
  const lines = content.split(/\r?\n/).map(normalizeLine);
  const nodes: ReactNode[] = [];

  let pendingListItems: ReactNode[] = [];

  const flushList = () => {
    if (pendingListItems.length > 0) {
      nodes.push(
        <ul key={`list-${nodes.length}`} className="list-disc space-y-1 pl-5 text-emerald-50/90">
          {pendingListItems}
        </ul>,
      );
      pendingListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingTag = (`h${Math.min(level + 1, 6)}` as unknown) as keyof ReactHTML;
      const headingClass = `font-semibold text-emerald-100 ${level <= 2 ? "mt-6 text-lg" : "mt-4 text-base"}`;

      nodes.push(
        createElement(headingTag, { key: `heading-${nodes.length}`, className: headingClass }, renderInline(headingText)),
      );
      return;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*+]\s+/, "");
      pendingListItems.push(<li key={`item-${index}`}>{renderInline(itemText)}</li>);
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} className="border-emerald-500/40" />);
      return;
    }

    flushList();
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-emerald-50/90">
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList();

  return <div className={`space-y-4 ${className ?? ""}`}>{nodes}</div>;
}
