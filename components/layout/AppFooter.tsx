import Link from 'next/link';
import BrandIdentity from '@/components/BrandIdentity';

interface FooterLink {
  label: string;
  href: string;
}

interface AppFooterProps {
  links?: FooterLink[];
  legalText?: string;
  divisionLabel?: string;
  brandSubtitle?: string;
}

const defaultLinks: FooterLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Profile', href: '/profile-settings' },
  { label: 'Register', href: '/register' },
];

export default function AppFooter({
  links = defaultLinks,
  legalText = '© 2026 FlexxRent GmbH. All rights reserved.',
  divisionLabel = 'International Division',
  brandSubtitle = 'Long-Term Housing Network',
}: AppFooterProps) {
  return (
    <footer className="bg-[#1d1d1f] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/[0.08] pb-12">
          <BrandIdentity
            href="/"
            subtitle={brandSubtitle}
            iconClassName="w-8 h-8 bg-white text-[#1d1d1f] flex items-center justify-center rounded-lg font-serif font-bold text-lg"
            titleClassName="font-serif text-lg tracking-wide font-medium text-white"
            subtitleClassName="text-[8px] uppercase tracking-widest text-white/40 mt-0.5"
          />

          <div className="flex flex-wrap gap-8 text-[11px] uppercase tracking-[0.2em] text-white/50 font-bold">
            {links.map((link) => (
              <Link key={link.href + link.label} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30 font-light gap-4 text-center md:text-left">
          <p>{legalText}</p>
          <p className="uppercase tracking-[0.15em] text-white/20">{divisionLabel}</p>
        </div>
      </div>
    </footer>
  );
}
