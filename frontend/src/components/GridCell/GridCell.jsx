import "./GridCell.css";

export default function GridCell({ type, onClick }) {
  return <div className={`cell ${type}`} onClick={onClick}></div>;
}
