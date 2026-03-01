import "./ActionButton.css";
import { useEffect } from "react";

export default function ActionButton({ text, primary, actionType, setLocked, grid, robot, setRobot, fetchMetrics }) {
  async function handleClick() {
    if (actionType === "connect") return;
    
    setLocked(true);
    const endpoint = actionType === "explore" ? "/explore" : "/train";
    let data;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ grid: grid }),
      });

      data = await res.json();
      console.log(data.status);
      
      if (actionType === "explore" && data.path) {
        // Start from an empty grid and build it up as the robot explores
        let progressiveGrid = Array(25).fill(0); 
        
        if (data.path.length > 0) {
            data.path.forEach((stateIndex, step) => {
              setTimeout(() => {
                 progressiveGrid[stateIndex] = data.robot[stateIndex];
                 let tempGrid = [...progressiveGrid];
                 
                 // Display the robot on the current step if it's not an obstacle.
                 // Otherwise, we just map it (it stays red obstacle) and next step it "retreats". 
                 if (data.robot[stateIndex] !== -100) {
                    tempGrid[stateIndex] = 2; 
                 }
                 setRobot(tempGrid);
              }, step * 300);
            });
            
            setTimeout(() => {
               setRobot([...data.robot]);
            }, data.path.length * 300);
        }
      }
      
      if (fetchMetrics) fetchMetrics();

    } catch (err) {
      console.error(err);
    } finally {
      if (actionType === "explore") {
         setTimeout(() => setLocked(false), (data?.path?.length || 0) * 300 + 100);
      } else {
         setLocked(false);
      }
    }
  }
  return (
    <button className={`action-btn ${primary ? "primary" : ""}`} onClick={handleClick}>
      {text}
    </button>
  );
}
