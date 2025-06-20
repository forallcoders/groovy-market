import Image from "next/image";
import Link from "next/link";

const BASE_URL = '/markets'

const navLinks = [
  {
    name: 'Markets',
    icon: '/icons/grid.svg',
    href: `${BASE_URL}`,
  },
  {
    name: 'Activity',
    icon: '/icons/chart-up.svg',
    href: `${BASE_URL}/activity`,
  },
  {
    name: 'Leaderboards',
    icon: '/icons/trophy.svg',
    href: `${BASE_URL}/leaderboards`,
  },
]

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  return (
    <div className={`flex gap-5 ${className}`}>
      {navLinks.map(item => (
        <Link className="flex gap-2 items-center" href={item.href} key={item.name}>
          <Image src={item.icon} alt="icon" width={50} height={50} className="h-[18px] w-[18px]" />
          <p className="text-[13px] text-[#A4A4AE] font-medium">{item.name}</p>
        </Link>
      ))}
    </div>
  );
}

