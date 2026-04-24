import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-uber-black text-white hover:bg-uber-gray-200 btn-glow active:scale-95",
  secondary:
    "bg-uber-surface text-uber-black border border-uber-border hover:bg-uber-gray-800 active:scale-95",
  danger:
    "bg-uber-red-DEFAULT text-white hover:bg-uber-red-light active:scale-95",
  success:
    "bg-uber-green-DEFAULT text-white hover:bg-uber-green-light active:scale-95",
  ghost:
    "bg-transparent text-uber-gray-400 hover:bg-uber-surface hover:text-uber-black active:scale-95",
  dark:
    "bg-uber-black text-white hover:bg-uber-gray-100 active:scale-95",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
