import "./Heatmap.css";

export default function Heatmap({ values = Array(25).fill(0) }) {
  return (
    <div className="heatmap">
      {values.map((v, i) => (
        <div key={i} className="heatcell" style={{ opacity: Math.max(0.1, Math.min(v || 0, 1)) }} />
      ))}
    </div>
  );
}
