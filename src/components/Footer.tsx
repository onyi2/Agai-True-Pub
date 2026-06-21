import { ShieldCheck, Wine, Users, Music, Star } from 'lucide-react';

export function Footer() {
  const items = [
    { icon: ShieldCheck, label: 'PREMIUM EXPERIENCE' },
    { icon: Wine, label: 'QUALITY DRINKS' },
    { icon: Users, label: 'GREAT ATMOSPHERE' },
    { icon: Music, label: 'LIVE ENTERTAINMENT' },
    { icon: Star, label: 'MEMORABLE MOMENTS' },
  ];

  return (
    <footer className="border-t border-gray-800 bg-[#0B0D11] print:hidden flex flex-col items-center">
      <div className="w-full flex flex-wrap justify-around items-center py-4 px-8 text-gray-500 gap-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <item.icon className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-bold tracking-[0.1em]">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="w-full border-t border-gray-900/50 py-3 text-center text-[10px] text-gray-600 tracking-wider">
        Design and Developed by{' '}
        <a 
          href="mailto:jamenya1988@gmail.com" 
          className="hover:text-amber-500/80 transition-colors font-medium"
        >
          Kepler Camp Codes
        </a>
      </div>
    </footer>
  );
}
