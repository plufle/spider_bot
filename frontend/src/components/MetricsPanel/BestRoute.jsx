import "./BestRoute.css";

export default function BestRoute({ fullQTable, grid }) {
  // Arrow mapping for [Up, Right, Down, Left]
  const arrowMap = ["↑", "→", "↓", "←"];

  const getBestActionArrow = (stateIndex) => {
    // If it's a goal or obstacle, don't show an arrow inside
    if (grid[stateIndex] === 100) return "🏁";
    if (grid[stateIndex] === -100) return "❌";

    const qValues = fullQTable[stateIndex];
    
    // If all q values are basically zero, the model hasn't learned anything here
    if (Math.max(...qValues) === 0 && Math.min(...qValues) === 0) return "·";

    // Find index of max
    const maxVal = Math.max(...qValues);
    const bestAction = qValues.indexOf(maxVal);

    return arrowMap[bestAction];
  };

  return (
    <div className="best-route-grid">
      {grid.map((val, i) => (
        <div key={i} className={`route-cell ${val === 1 ? "start" : ""}`}>
          {getBestActionArrow(i)}
        </div>
      ))}
    </div>
  );
}
