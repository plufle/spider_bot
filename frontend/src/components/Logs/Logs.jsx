import "./Logs.css";

export default function Logs({ logs = [] }) {
  return (
    <div className="logs">
      {logs.map((log, index) => (
        <p key={index}>{log}</p>
      ))}
    </div>
  );
}
