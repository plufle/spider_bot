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
    </main>
  );
}
