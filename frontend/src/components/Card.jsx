const Card = ({ children, className = "", hover = true, glass = false, ...props }) => {
  return (
    <div
      className={`
        rounded-2xl p-5
        ${glass
          ? "glass"
          : "bg-uber-card border border-uber-border"
        }
        ${hover ? "card-hover" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
