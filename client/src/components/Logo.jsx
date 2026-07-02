export default function Logo({ size = 30, dark = true, wordmark = "Marquee", suffix }) {
  const box = size;
  const inner = Math.round(size * 0.37);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div
        style={{
          width: box,
          height: box,
          borderRadius: box * 0.28,
          background: "var(--violet-600)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: inner, height: inner, border: "2.5px solid #fff", borderRadius: 4 }} />
      </div>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: Math.round(size * 0.63),
          color: dark ? "#fff" : "var(--ink)",
        }}
      >
        {wordmark}
        {suffix && <span style={{ color: "#8B8794", fontWeight: 500 }}> {suffix}</span>}
      </span>
    </div>
  );
}
