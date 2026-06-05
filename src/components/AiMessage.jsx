// =============================================================================
// src/components/AiMessage.jsx
// =============================================================================
// Renderiza la respuesta de la IA con las citas legales extraidas como
// chips debajo del texto. Reutilizado por CaseWorkspace y GlobalChat.
// =============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import CitationBadge from './CitationBadge';
import { parseCitations } from '../utils/citationParser';

const renderInlineText = (text) => {
  // Renderizado simple: parrafos separados por doble salto de linea,
  // listas cuando arranca con -, * o numero.
  const blocks = String(text || '').split(/\n{2,}/);
  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (/^([-*]|\d+[.)])\s+/.test(trimmed)) {
      const lines = trimmed.split(/\n/);
      return (
        <ul key={idx} className="my-1.5 list-disc space-y-1 pl-5">
          {lines.map((line, lineIdx) => (
            <li key={lineIdx}>{line.replace(/^([-*]|\d+[.)])\s+/, '')}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="my-1.5 leading-relaxed">
        {trimmed.split('\n').map((line, lineIdx) => (
          <span key={lineIdx}>
            {lineIdx > 0 && <br />}
            {line}
          </span>
        ))}
      </p>
    );
  });
};

const AiMessage = ({ content, author = 'ai' }) => {
  const [expanded, setExpanded] = useState(false);
  const citations = author === 'ai' ? parseCitations(content) : [];
  const isLong = String(content || '').length > 1200;
  const visible = isLong && !expanded ? `${content.slice(0, 1200)}...` : content;

  if (author !== 'ai') {
    return (
      <p className="my-1.5 whitespace-pre-wrap leading-relaxed">{content}</p>
    );
  }

  return (
    <div>
      <div className="text-sm text-brand-ivory">{renderInlineText(visible)}</div>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky-300"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" /> Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Ver respuesta completa
            </>
          )}
        </button>
      )}

      {citations.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-accent">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Citas en esta respuesta
          </p>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((citation) => (
              <CitationBadge
                key={`${citation.type}-${citation.label}`}
                citation={citation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiMessage;
