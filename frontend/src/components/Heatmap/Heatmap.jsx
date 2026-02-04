import "./Heatmap.css";

export default function Heatmap() {
  const values = Array.from({ length: 25 }, () => Math.random());

  return (
    <div className="heatmap">
      {values.map((v, i) => (
        <div key={i} className="heatcell" style={{ opacity: v }} />
      ))}
    </div>
  );
}
