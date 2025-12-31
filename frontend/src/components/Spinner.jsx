import './Spinner.css';

export default function Spinner({ large = false }) {
  return (
    <div className="spinner-container">
      <div className={`spinner ${large ? 'spinner-large' : ''}`}></div>
    </div>
  );
}
