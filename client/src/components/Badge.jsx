const TONES = {
  paid: { bg: "var(--paid-bg)", text: "var(--paid-text)", dot: "var(--paid)" },
  pending: { bg: "var(--pending-bg)", text: "var(--pending-text)", dot: "var(--pending)" },
  failed: { bg: "var(--failed-bg)", text: "var(--failed-text)", dot: "var(--failed)" },
  checkedin: { bg: "var(--checked-in-bg)", text: "var(--checked-in-text)", dot: "var(--checked-in)" },
  draft: { bg: "var(--void-bg)", text: "var(--void-text)", dot: null },
  void: { bg: "var(--void-bg)", text: "var(--void-text)", dot: null },
};

export default function Badge({ tone = "draft", children, dot = true }) {
  const t = TONES[tone] || TONES.draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: t.bg,
        color: t.text,
        fontWeight: 600,
        fontSize: 12,
        padding: "5px 11px",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
      }}
    >
      {dot && t.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot }} />}
      {children}
    </span>
  );
}
