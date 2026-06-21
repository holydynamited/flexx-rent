import Link from 'next/link';

interface BrandIdentityProps {
  href?: string;
  ariaLabel?: string;
  title?: string;
  subtitle?: string;
  iconText?: string;
  className?: string;
  iconClassName?: string;
  textWrapperClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export default function BrandIdentity({
  href,
  ariaLabel = 'Go to homepage',
  title = 'FlexxRent',
  subtitle,
  iconText = 'F',
  className = 'flex items-center space-x-3',
  iconClassName = 'w-9 h-9 bg-[#1d1d1f] flex items-center justify-center rounded-xl text-white font-serif font-bold text-xl',
  textWrapperClassName = 'flex flex-col text-left',
  titleClassName = 'font-serif text-lg tracking-wide font-semibold leading-none',
  subtitleClassName = 'text-[9px] uppercase tracking-[0.25em] text-slate-400 font-light mt-1',
}: BrandIdentityProps) {
  const content = (
    <>
      <div className={iconClassName}>{iconText}</div>
      <div className={textWrapperClassName}>
        <span className={titleClassName}>{title}</span>
        {subtitle ? <span className={subtitleClassName}>{subtitle}</span> : null}
      </div>
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
