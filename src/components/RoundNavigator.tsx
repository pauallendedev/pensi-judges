import { useBattle } from './BattleProvider';

interface Props {
  totalRounds: number;
}

export default function RoundNavigator({ totalRounds }: Props) {
  const { currentRoundIndex, setCurrentRoundIndex } = useBattle();

  return (
    <div className="flex justify-between items-center my-6">
      <button
        disabled={currentRoundIndex === 0}
        onClick={() => setCurrentRoundIndex(currentRoundIndex - 1)}
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span className="text-sm text-gray-600">
        Ronda {currentRoundIndex + 1} / {totalRounds}
      </span>
      <button
        disabled={currentRoundIndex === totalRounds - 1}
        onClick={() => setCurrentRoundIndex(currentRoundIndex + 1)}
        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  );
}
