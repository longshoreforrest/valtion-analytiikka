export interface Crumb {
  label: string;
  onClick?: () => void;
}

interface Props {
  crumbs: Crumb[];
}

export default function Breadcrumb({ crumbs }: Props) {
  return (
    <nav
      aria-label="porautumisen polku"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
        fontSize: 13,
        margin: "6px 0 16px",
      }}
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            {c.onClick && !last ? (
              <button
                onClick={c.onClick}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {c.label}
              </button>
            ) : (
              <span style={{ color: last ? "var(--fg)" : "var(--fg-dim)", fontWeight: last ? 600 : 400 }}>
                {c.label}
              </span>
            )}
            {!last ? <span style={{ color: "var(--fg-dim)" }}>›</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
