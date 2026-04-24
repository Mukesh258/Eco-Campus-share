const Input = ({
  label,
  icon,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-uber-black mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-uber-gray-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full rounded-xl bg-uber-surface border border-uber-border
            text-uber-black placeholder-uber-gray-400
            px-4 py-3 text-sm font-medium
            outline-none transition-all duration-200
            focus:border-uber-black focus:ring-2 focus:ring-uber-black/10 focus:bg-uber-white
            hover:border-uber-gray-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${error ? "border-uber-red-DEFAULT focus:ring-uber-red-DEFAULT/30" : ""}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-uber-red-DEFAULT">{error}</p>
      )}
    </div>
  );
};

export default Input;
