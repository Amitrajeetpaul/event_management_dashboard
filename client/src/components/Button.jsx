export default function Button({ variant = "primary", size = "md", icon, children, className = "", ...rest }) {
  const cls = ["mq-btn", `mq-btn--${variant}`, `mq-btn--${size}`, className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
