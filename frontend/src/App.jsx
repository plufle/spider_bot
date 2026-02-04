import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import GridBoard from "./components/GridBoard/GridBoard";
import MetricsPanel from "./components/MetricsPanel/MetricsPanel";

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <GridBoard />
      <MetricsPanel />
    </div>
  );
}
