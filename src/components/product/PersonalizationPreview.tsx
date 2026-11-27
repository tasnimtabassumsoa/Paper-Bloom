interface PersonalizationPreviewProps {
  text: string;
  foilColor?: string;
  fontStyle?: string;
  coverTone?: 'terracotta' | 'sage' | 'sand' | 'ink';
}

const COVER_BG: Record<NonNullable<PersonalizationPreviewProps['coverTone']>, string> = {
  terracotta: 'bg-[#9f3c16]',
  sage: 'bg-[#476553]',
  sand: 'bg-[#d8c4b6]',
  ink: 'bg-[#222825]',
};

const FOIL_COLOR_MAP: Record<string, string> = {
  'Warm Gold': 'text-[#f6dba6]',
  'Gold Leaf': 'text-[#f6dba6]',
  'Rose Copper': 'text-[#f0c2ae]',
  'Matte Ink': 'text-[#181d1a]',
  'Deep Charcoal': 'text-[#181d1a]',
  'Deep Walnut': 'text-[#4f3222]',
  'Terracotta Ink': 'text-[#9f3c16]',
  'Forest Sage': 'text-[#c7e8d1]',
  'Sage Tint': 'text-[#c7e8d1]',
  'Blind Deboss': 'text-black/35',
};

export function PersonalizationPreview({
  text,
  foilColor = 'Warm Gold',
  fontStyle = 'Classic Serif',
  coverTone = 'terracotta',
}: PersonalizationPreviewProps) {
  const display = text.trim() || 'Your Name · আপনার নাম';
  const isLightCover = coverTone === 'sand';
  const textColor =
    isLightCover && foilColor === 'Warm Gold'
      ? 'text-[#7c5319]'
      : FOIL_COLOR_MAP[foilColor] ?? 'text-[#f6dba6]';

  const fontClass =
    fontStyle === 'Modern Sans' || fontStyle === 'Clean Rounded'
      ? 'font-sans tracking-wide font-semibold'
      : fontStyle === 'Editorial Script'
        ? 'font-editorial italic font-semibold'
        : 'font-editorial font-medium';

  return (
    <div
      className="relative mx-auto w-full max-w-[270px] aspect-[4/5] rounded-2xl p-5 flex flex-col justify-between shadow-[0_20px_40px_-18px_rgba(24,29,26,0.35)] border border-black/10 select-none overflow-hidden"
      aria-label="Live cover personalization preview"
    >
      <div className={`absolute inset-0 ${COVER_BG[coverTone]}`} />
      {/* Spine fold & elastic band */}
      <div className="absolute inset-y-0 left-3.5 w-1.5 bg-black/15" aria-hidden="true" />
      <div className="absolute inset-y-0 right-4 w-2.5 bg-[#181d1a]/30" aria-hidden="true" />

      <div className="relative z-10 flex justify-between items-center text-[10px] tracking-[0.22em] uppercase text-white/60 pl-4">
        <span>Paper Bloom</span>
        <span>{foilColor}</span>
      </div>

      <div className="relative z-10 my-auto mx-3 px-4 py-7 rounded-lg border border-white/25 text-center backdrop-blur-[1px]">
        <p
          className={`text-xl sm:text-2xl leading-snug break-words ${fontClass} ${textColor}`}
          style={{ textShadow: foilColor === 'Blind Deboss' ? '0 1px 0 rgba(255,255,255,0.2)' : undefined }}
        >
          {display}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
          {fontStyle}
        </p>
      </div>

      <div className="relative z-10 text-center text-[10px] tracking-widest uppercase text-white/55">
        English &amp; বাংলা Supported
      </div>
    </div>
  );
}
