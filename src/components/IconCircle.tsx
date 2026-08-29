import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const VARIANT_HOVER = {
  neutral: "hover:bg-brand-600 hover:text-white",
  pink: "hover:bg-pink-600 hover:text-white",
  blue: "hover:bg-blue-600 hover:text-white",
} as const;

export default function IconCircle({
  icon: Icon,
  variant = "neutral",
  size = "md",
  className = "",
}: {
  icon: IconComponent;
  variant?: keyof typeof VARIANT_HOVER;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full bg-surface-muted text-fg-muted transition-all duration-150 ease-out hover:scale-110 active:scale-95 ${VARIANT_HOVER[variant]} ${className}`}
    >
      <Icon className={iconDim} strokeWidth={2} />
    </span>
  );
}
