import React from 'react';

interface BrandLogoProps {
  variant?: 'header' | 'footer' | 'founder';
  theme?: 'light' | 'dark';
  title?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  theme = 'light',
  title = 'Dr. Ali Hassan',
}) => {
  const goldColor = theme === 'dark' ? 'text-[#D4B475]' : 'text-[#A88649]';
  const strokeColor = theme === 'dark' ? '#D4B475' : '#A88649';
  const pipeColor = theme === 'dark' ? 'border-[#D4B475]/80' : 'border-[#A88649]/80';

  if (variant === 'header') {
    return (
      <span className={`inline-flex flex-col items-center select-none leading-none ${goldColor}`}>
        <span className="relative inline-block font-signature text-[28px] sm:text-[34px] leading-[0.82] tracking-[0.01em] whitespace-nowrap">
          {title}
          <svg
            aria-hidden="true"
            viewBox="0 0 80 10"
            className="absolute right-0 -bottom-0.5 w-[44%] h-[5px] overflow-visible pointer-events-none"
            fill="none"
          >
            <path
              d="M2 7.5C24 4.5 52 2.5 78 3"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span
          className={`mt-1.5 px-1.5 border-x ${pipeColor} font-sans text-[7.5px] sm:text-[8.5px] font-medium uppercase tracking-[0.18em] leading-none whitespace-nowrap`}
        >
          HEALTH &amp; WELLNESS
        </span>
      </span>
    );
  }

  if (variant === 'founder') {
    return (
      <div className={`inline-flex flex-col items-center select-none leading-none ${goldColor}`}>
        <span className="relative inline-block font-signature text-[44px] sm:text-[52px] leading-[0.85] tracking-[0.01em] whitespace-nowrap">
          {title}
          <svg
            aria-hidden="true"
            viewBox="0 0 80 10"
            className="absolute right-0 -bottom-1 w-[44%] h-[7px] overflow-visible pointer-events-none"
            fill="none"
          >
            <path
              d="M2 7.5C24 4.5 52 2.5 78 3"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span
          className={`mt-2.5 px-2.5 border-x ${pipeColor} font-sans text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] leading-none whitespace-nowrap`}
        >
          HEALTH &amp; WELLNESS
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center select-none leading-none ${goldColor}`}>
      <span className="relative inline-block font-signature text-[42px] sm:text-[46px] leading-[0.84] tracking-[0.01em] whitespace-nowrap">
        {title}
        <svg
          aria-hidden="true"
          viewBox="0 0 80 10"
          className="absolute right-0 -bottom-0.5 w-[44%] h-[6px] overflow-visible pointer-events-none"
          fill="none"
        >
          <path
            d="M2 7.5C24 4.5 52 2.5 78 3"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={`mt-2 px-2 border-x ${pipeColor} font-sans text-[10px] font-medium uppercase tracking-[0.2em] leading-none whitespace-nowrap`}
      >
        HEALTH &amp; WELLNESS
      </span>
    </div>
  );
};
