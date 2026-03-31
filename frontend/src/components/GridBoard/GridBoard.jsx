import "./GridBoard.css";
import GridCell from "../GridCell/GridCell";
const size = 5;

export default function GridBoard({locked,grid,setGrid,robot,setRobot,btStatus}) {
  function updateGrid(id) {
    if(locked) return;
    setGrid((prev) => {
      const newGrid = [...prev];
      if (newGrid[id] === 0) newGrid[id] = -100; 
      else if (newGrid[id] === -100) newGrid[id] = 100; 
      else if (newGrid[id] === 100) newGrid[id] = 1; 
      else if (newGrid[id] === 1) newGrid[id] = 0;

      if(newGrid.filter(val=>val===1).length>1){
        alert("No More Than One Start State")
        newGrid[id] = 0;
      }
      if(newGrid.filter(val=>val===100).length>1){
        alert("No More Than  One Goal State")
        newGrid[id] = 0;
      }
      return newGrid;
    });
  }

  return (
    <main className="gridboard">
      <div className="boards-wrapper">
        {/* Environment View */}
        <div className="board-container">
          <div className="board-header">
            <h1>Environment View</h1>
            <span className={`status-badge ${locked ? "locked" : "active"}`}>{locked ? "Locked" : "Active"}</span>
          </div>
          <div className="grid">
            {grid.map((val, i) => {
              let type = "empty";
              if (val === 1) type = "start";
              else if (val === 100) type = "goal";
              else if (val === -100) type = "obstacle";
              return (
                <GridCell
                  key={i}
                  type={type}
                  onClick={() => updateGrid(i)}
                />
              );
            })}
          </div>
        </div>

        {/* Robot View */}
        <div className="board-container">
          <div className="board-header">
            <h1>Robot Perspective</h1>
            <span className={`status-badge sensor ${btStatus}`}>{btStatus === "online" ? "ONLINE" : "OFFLINE"}</span>
          </div>
          <div className="grid">
            {robot.map((val, i) => {
              let type = "empty";
              if (val === 1) type = "start";
              else if (val === 100) type = "goal";
              else if (val === -100) type = "obstacle";
              else if (val === 2) type = "robot";
              return <GridCell key={i} type={type} />;
            })}
          </div>
        </div>
      </div>

      <div className="legend-container">
        <h3>State & Symbol Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color robot"></div>
            <span>Start State</span>
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
