import "./GridBoard.css";
import GridCell from "../GridCell/GridCell";

const size = 5;

export default function GridBoard() {
  const robot = [0, 0];
  const goal = [4, 4];

  const obstacles = [
    [1, 1],
    [1, 2],
    [3, 2],
  ];

  return (
    <main className="gridboard">
      <div className="boards-wrapper">
        {/* Environment View */}
        <div className="board-container">
          <div className="board-header">
            <h1>Environment View</h1>
            <span className="status-badge">Active</span>
          </div>
          <div className="grid">
            {[...Array(size * size)].map((_, i) => {
              const r = Math.floor(i / size);
              const c = i % size;
              let type = "empty";
              if (r === robot[0] && c === robot[1]) type = "robot";
              else if (r === goal[0] && c === goal[1]) type = "goal";
              else if (obstacles.some(o => o[0] === r && o[1] === c)) type = "obstacle";
              return <GridCell key={i} type={type} />;
            })}
          </div>
        </div>

        {/* Robot View */}
        <div className="board-container">
          <div className="board-header">
            <h1>Robot Perception</h1>
            <span className="status-badge sensor">LIDAR</span>
          </div>
          <div className="grid">
            {[...Array(size * size)].map((_, i) => {
              const r = Math.floor(i / size);
              const c = i % size;
              let type = "empty";
              // Simulating same view for now
              if (r === robot[0] && c === robot[1]) type = "robot";
              else if (r === goal[0] && c === goal[1]) type = "goal";
              else if (obstacles.some(o => o[0] === r && o[1] === c)) type = "obstacle";
              return <GridCell key={`robot-${i}`} type={type} />;
            })}
          </div>
        </div>
      </div>

      <div className="legend-container">
        <h3>State & Symbol Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color robot"></div>
            <span>Robot Agent</span>
          </div>
          <div className="legend-item">
            <div className="legend-color goal"></div>
            <span>Target Goal</span>
          </div>
          <div className="legend-item">
            <div className="legend-color obstacle"></div>
            <span>Obstacle</span>
          </div>
          <div className="legend-item">
            <div className="legend-color empty"></div>
            <span>Free Space</span>
          </div>
        </div>
      </div>
    </main>
  );
}
