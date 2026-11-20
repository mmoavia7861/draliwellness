import React from 'react';

const renderInlineBold = (line: string): React.ReactNode[] => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#174D40]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

export const FormattedAiText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;

        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={idx} className="font-serif font-semibold text-[#174D40] pt-1">
              {renderInlineBold(headingMatch[1])}
            </p>
          );
        }

        const bulletMatch = line.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#174D40] font-semibold leading-relaxed">•</span>
              <span>{renderInlineBold(bulletMatch[1])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
};
