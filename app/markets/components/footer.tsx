import Image from "next/image"
import Link from "next/link"

const links = [
  {
    id: "terms-of-service",
    name: "Terms of service",
    target: "_self",
    href: "/markets/terms-and-conditions",
  },
  {
    id: "support",
    name: "Support",
    href: "https://t.me/+Fzwl4cakdTA2M2Rh",
    target: "_blank",
  },
]

export default function Footer() {
  return (
    <div className="flex flex-col justify-center items-center h-[304px] bg-[#29292C] gap-7 sm:mb-0 mb-20">
      <Image
        width={170}
        height={107}
        src="/images/gm-logo-big.png"
        alt="groovy market logo"
        className="w-43"
      />

      <Link
        href="https://x.com/GroovyMarket_"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-5"
      >
        <p className="text-[#CC0066] text-[13px] font-bold">Follow us</p>
        <Image
          width={50}
          height={50}
          src="/images/x-logo.png"
          alt="x logo"
          className="w-13"
        />
      </Link>
      <div className="flex flex-col gap-3 items-center">
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              target={link.target}
              rel="noopener"
              className="text-[#A4A4AE]/75 text-[13px] font-semibold"
            >
              {link.name}
            </Link>
          ))}
        </div>
        <p className="text-[#A4A4AE]/50 text-[13px] font-light">
          ©2025 GroovyMarket All rights reserved
        </p>
      </div>
    </div>
  )
}
