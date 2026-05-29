import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-wood text-primary-foreground hover:bg-wood/90 active:bg-wood/80",
  forest:
    "bg-forest text-accent-foreground hover:bg-forest/90 active:bg-forest/80",
  outline:
    "border border-wood/40 bg-transparent text-wood hover:bg-wood hover:text-primary-foreground",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
  icon: "h-10 w-10",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
