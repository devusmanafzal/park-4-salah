import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showWordmark?: boolean;
};

/**
 * Park for Salah logo.
 * A 'P' inside a soft rounded square, with a thin crescent arch
 * above suggesting prayer / mosque dome. Pure SVG, scales perfectly.
 */
const Logo = ({ className, showWordmark = true }: Props) => {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
      >
        {/* rounded mark background */}
        <rect x="2" y="2" width="36" height="36" rx="10" fill="hsl(var(--primary))" />
        {/* crescent arch above the P */}
        <path
          d="M11 13 Q20 6 29 13"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        {/* letter P */}
        <path
          d="M15 14.5 V29 M15 14.5 H22 a4.2 4.2 0 0 1 0 8.4 H15"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg leading-none whitespace-nowrap">
          Park for Salah
        </span>
      )}
    </span>
  );
};

export default Logo;
