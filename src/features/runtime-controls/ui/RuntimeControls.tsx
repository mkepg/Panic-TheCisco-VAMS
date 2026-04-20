import { Play, Square, Pause } from 'lucide-react';
import { useVamsStore } from '@/core/store';

export default function RuntimeControls() {
  const simulationState = useVamsStore((state) => state.simulationState);
  const play = useVamsStore((state) => state.play);
  const pause = useVamsStore((state) => state.pause);
  const stop = useVamsStore((state) => state.stop);

  return (
    <div className="controls">
      <button
        onClick={simulationState === 'PLAYING' ? pause : play}
        className={`btn-play ${
          simulationState === 'PLAYING'
            ? 'running'
            : simulationState === 'PAUSED'
              ? 'paused'
              : 'stopped'
        }`}
        title={simulationState === 'PLAYING' ? 'Pause' : 'Play'}
      >
        {simulationState === 'PLAYING' ? (
          <Pause size={12} fill="currentColor" />
        ) : (
          <Play size={12} fill="currentColor" />
        )}
        {simulationState === 'PLAYING'
          ? 'PAUSE'
          : simulationState === 'PAUSED'
            ? 'RESUME'
            : 'RUN'}
      </button>

      <button
        onClick={stop}
        className="btn-stop"
        disabled={simulationState === 'STOPPED'}
        title="Stop & Reset"
      >
        <Square size={12} fill="currentColor" />
        STOP
      </button>
    </div>
  );
}
