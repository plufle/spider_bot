import "./Heatmap.css";

export default function Heatmap({ values = Array(25).fill(0) }) {
  return (
    <div className="heatmap">
      {values.map((v, i) => (
        <div 
          key={i} 
          className="heatcell" 
        >
          {Number(v || 0).toFixed(2)}
        </div>
      ))}
    </div>
  );
}
