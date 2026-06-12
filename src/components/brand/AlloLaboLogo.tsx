import Image from 'next/image';
import Link from 'next/link';

export const ALLO_LABO_LOGO_SRC = '/images/allo-labo-logo.webp';

type AlloLaboLogoProps = {
  /** Taille du logo en pixels (carré). */
  size?: number;
  className?: string;
  imageClassName?: string;
  href?: string;
  /** Affiche « Allo-Labo » à côté du logo (header public). */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  priority?: boolean;
  onClick?: () => void;
};

export function AlloLaboLogo({
  size = 40,
  className = '',
  imageClassName = '',
  href,
  showWordmark = false,
  wordmarkClassName = '',
  subtitle,
  subtitleClassName = '',
  priority = false,
  onClick,
}: AlloLaboLogoProps) {
  const content = (
    <>
      <Image
        src={ALLO_LABO_LOGO_SRC}
        alt="Allo Labo"
        width={size}
        height={size}
        priority={priority}
        className={`shrink-0 object-contain ${imageClassName}`.trim()}
      />
      {showWordmark || subtitle ? (
        <div className="min-w-0 leading-tight">
          {showWordmark ? (
            <p
              className={`truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg ${wordmarkClassName}`.trim()}
            >
              Allo-Labo
            </p>
          ) : null}
          {subtitle ? (
            <p
              className={`truncate text-[11px] uppercase tracking-widest ${subtitleClassName}`.trim()}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const wrapClass = `flex min-w-0 items-center gap-2.5 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={wrapClass} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={wrapClass} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
