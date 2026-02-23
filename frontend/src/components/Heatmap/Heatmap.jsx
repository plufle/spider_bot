import "./Heatmap.css";
import { useMemo } from "react";

export default function Heatmap() {
  const values = useMemo(
    () => Array.from({ length: 25 }, () => Math.random()),
    [] // only compute once on mount
  );

  return (
    <div className="heatmap">
      {values.map((v, i) => (
        <div key={i} className="heatcell" style={{ opacity: v }} />
      ))}
    </div>
  );
}
