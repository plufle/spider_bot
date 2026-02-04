import "./GridCell.css";

export default function GridCell({ type }) {
  return <div className={`cell ${type}`}></div>;
}
