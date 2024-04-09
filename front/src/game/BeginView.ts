import './BeginView.css'; // Import your CSS file for styling
import { useState } from "React";

function BeginView() {
  const [showOverlay, setShowOverlay] = useState(false);

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className="foreground-view">
      <button onClick={toggleOverlay}>Toggle Overlay</button>

      {/* Conditionally render the overlay */}
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>This is an overlay</h2>
            <p>Overlay content goes here...</p>
            <button onClick={toggleOverlay}>Close Overlay</button>
          </div>
        </div>
      )}

      {/* Main content of the application */}
      <div className="main-content">
        {/* Main content goes here */}
      </div>
    </div>
  );
}

export default BeginView;