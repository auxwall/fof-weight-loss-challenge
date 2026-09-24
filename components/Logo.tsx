import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  href?: string;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", href = "/", showText = false, className = "" }: LogoProps) {
  const dimensions = {
    sm: { width: 100, height: 34, text: "text-[9px]" },
    md: { width: 150, height: 50, text: "text-[10px]" },
    lg: { width: 220, height: 72, text: "text-xs" },
    xl: { width: 280, height: 90, text: "text-sm" },
    "2xl": { width: 350, height: 115, text: "text-base" },
  }[size];

  const content = (
    <div className={`flex flex-col items-center justify-center select-none group ${className}`}>
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="Club Logo"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain w-auto max-h-[70px] sm:max-h-[90px] md:max-h-[105px]"
          style={{ height: `${dimensions.height}px`, width: "auto" }}
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold uppercase tracking-[0.22em] text-zinc-400 mt-1 text-center whitespace-nowrap leading-none ${dimensions.text}`}>
          30-Day Weight Loss
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center justify-center">
        {content}
      </Link>
    );
  }

  return content;
}
