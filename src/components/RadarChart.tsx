/** Oyuncu Özellikleri radar (örümcek ağı) grafiği. Harici kütüphane kullanmadan SVG ile çizilir. */
export function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 260;
  const c = size / 2;
  const r = 82;
  const n = data.length;

  // İlk eksen tepede olacak şekilde açıyı hesapla
  const point = (i: number, ratio: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(angle) * r * ratio, c + Math.sin(angle) * r * ratio] as const;
  };
  const polygon = (ratio: (i: number) => number) =>
    data.map((_, i) => point(i, ratio(i)).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[280px]" role="img" aria-label="Oyuncu özellikleri grafiği">
      {[0.33, 0.66, 1].map((ring) => (
        <polygon key={ring} points={polygon(() => ring)} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}

      <polygon
        points={polygon((i) => data[i].value / 100)}
        fill="color-mix(in srgb, #00e676 25%, transparent)"
        stroke="#00e676"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, d.value / 100);
        return <circle key={d.label} cx={x} cy={y} r={3.5} fill="#00e676" />;
      })}

      {data.map((d, i) => {
        const [x, y] = point(i, 1.22);
        return (
          <text key={d.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="var(--fg)">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
