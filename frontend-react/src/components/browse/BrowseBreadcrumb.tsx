import { Link } from "react-router-dom";

export function BrowseBreadcrumb(props: { items: { to?: string; label: string }[] }) {
  return (
    <nav className="text-sm text-color-secondary mb-4" aria-label="Навигация по разделам">
      {props.items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 && <span className="mx-2">/</span>}
          {item.to ? (
            <Link to={item.to} className="text-primary no-underline">
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-color)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
