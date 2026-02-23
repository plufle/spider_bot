import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import GridBoard from "./components/GridBoard/GridBoard";
import MetricsPanel from "./components/MetricsPanel/MetricsPanel";
import { useState } from "react";

export default function App() {
  const [locked,setLocked] = useState(false);
  const [grid,setGrid] = useState(Array(5 * 5).fill(0));
  const [robot,setRobot] = useState(Array(5 * 5).fill(0));

  return (
    <div className="app-layout">
      <Sidebar setLocked={setLocked}/>
      <GridBoard locked={locked} grid={grid} setGrid={setGrid} robot={robot} setRobot={setRobot}/>
      <MetricsPanel />
    </div>
  );
}
