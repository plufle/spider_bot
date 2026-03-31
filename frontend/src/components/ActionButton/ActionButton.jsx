import "./ActionButton.css";
import { useEffect } from "react";

export default function ActionButton({ text, primary, actionType, setLocked, grid, robot, setRobot, fetchMetrics }) {
  async function handleClick() {
    setLocked(true);
    let endpoint = "";
    if (actionType === "explore") endpoint = "/explore";
    else if (actionType === "train") endpoint = "/train";
    else if (actionType === "connect") endpoint = "/connect";
    
    let data;
    
    try {
      // Connect might not need the grid body, but it doesn't hurt to send it or we can pass empty JSON 
      // For consistency, we'll send empty body for connect, grid for others
      const bodyPayload = actionType === "connect" ? {} : { grid: grid };
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      data = await res.json();
      console.log(data.status);
      
      if (actionType === "connect" && data.bt_status) {
        // If connecting, wait for next polling or manually push if parent passed it down
        // It's handled by setInterval globally, or we can just fetchMetrics to force sync
      }
      
      if (fetchMetrics) fetchMetrics();

    } catch (err) {
      console.error(err);
    } finally {
      // The background thread unlocks the UI automatically when exploration ends
      // Because App.jsx is syncing `is_exploring` to `locked`.
      // We only manually unlock for connect and train. 
      if (actionType !== "explore") {
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
