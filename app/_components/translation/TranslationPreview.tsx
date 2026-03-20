import React from 'react';
import { parseTranslationSegments } from '@/lib/translationUtils';

type TranslationPreviewProps = {
  text: string;
};

export default function TranslationPreview({ text }: TranslationPreviewProps) {
  if (!text) return <span className="text-muted-foreground italic">Puste</span>;
  
  const segments = parseTranslationSegments(text);
  const rendered = segments.reduce<{
    insideHighlight: boolean;
    nodes: React.ReactNode[];
  }>((acc, seg, i) => {
    if (seg.type === 'variable') {
      return {
        ...acc,
        nodes: [
          ...acc.nodes,
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-amber-100 text-amber-800 font-mono text-xs border border-amber-200"
            title="Zmienna dynamiczna — nie edytuj"
          >
            {seg.value}
          </span>,
        ],
      };
    }

    if (seg.type === 'highlight_open') {
      return {
        insideHighlight: true,
        nodes: [
          ...acc.nodes,
          <span
            key={i}
            className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded-l bg-primary/10 text-primary font-mono text-xs"
            title="Początek pogrubienia"
          >
            ⟨b⟩
          </span>,
        ],
      };
    }

    if (seg.type === 'highlight_close') {
      return {
        insideHighlight: false,
        nodes: [
          ...acc.nodes,
          <span
            key={i}
            className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded-r bg-primary/10 text-primary font-mono text-xs"
            title="Koniec pogrubienia"
          >
            ⟨/b⟩
          </span>,
        ],
      };
    }

    return {
      ...acc,
      nodes: [
        ...acc.nodes,
        <span key={i} className={acc.insideHighlight ? 'font-bold' : ''}>
          {seg.value}
        </span>,
      ],
    };
  }, { insideHighlight: false, nodes: [] });
  
  return (
    <span className="text-sm leading-relaxed">{rendered.nodes}</span>
  );
}