
export default function StatCard({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return (
    <div className="card">
      <div className="kpi">{value}</div>
      <div className="kpi-label">{title}</div>
      {note && <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>{note}</div>}
    </div>
  );
}
