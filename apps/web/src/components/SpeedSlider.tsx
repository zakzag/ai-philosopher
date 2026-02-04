import './SpeedSlider.css';

interface SpeedSliderProps {
  speed: number;
  onChange: (speed: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onJumpToEnd: () => void;
}

export function SpeedSlider({
  speed,
  onChange,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onJumpToEnd,
}: SpeedSliderProps) {
  // Convert internal speed (ms per char) to display speed (1-10 scale)
  const displaySpeed = Math.round(11 - speed / 10);

  const handleSpeedChange = (value: number) => {
    // Convert display speed to internal speed
    const internalSpeed = (11 - value) * 10;
    onChange(internalSpeed);
  };

  return (
    <div className="speed-slider">
      <div className="replay-controls">
        <button className="control-btn" onClick={onReset} title="Reset">
          ⏮️
        </button>
        {isPlaying ? (
          <button className="control-btn control-btn-main" onClick={onPause} title="Pause">
            ⏸️
          </button>
        ) : (
          <button className="control-btn control-btn-main" onClick={onPlay} title="Play">
            ▶️
          </button>
        )}
        <button className="control-btn" onClick={onJumpToEnd} title="Jump to end">
          ⏭️
        </button>
      </div>

      <div className="speed-control">
        <label>Speed: {displaySpeed}x</label>
        <input
          type="range"
          min={1}
          max={10}
          value={displaySpeed}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
