import Link from "next/link";
import Logo from "./Logo";

interface HeaderProps {
  rightAction?: "staff" | "home" | "none";
  customAction?: React.ReactNode;
}

export default function Header({ rightAction = "home", customAction }: HeaderProps) {
  return (
    <header className="border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[4.5rem] py-2 flex items-center justify-between">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          {customAction ? (
            customAction
          ) : rightAction === "home" ? (
            <Link href="/" className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-surface-border hover:border-gymRed/50 hover:bg-surface-card transition-all" >
              Home
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
