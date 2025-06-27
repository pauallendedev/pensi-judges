"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MC {
  id: string;
  name: string;
}

interface Round {
  id: string;
  name: string;
  doubleRound: boolean;
}

interface Pattern {
  value: number | null;
  isResponse?: boolean;
}

interface Intervention {
  mcId: string;
  patterns: Pattern[];
}

export default function ReadOnlyBattlePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mcs, setMcs] = useState<MC[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [scores, setScores] = useState<Record<string, Intervention[]>>({});
  const [bonusScores, setBonusScores] = useState<Record<string, Record<string, number>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mcsRaw = searchParams.get("mcs");
    const roundsRaw = searchParams.get("rounds");
    const scoresRaw = searchParams.get("scores");
    const bonusRaw = searchParams.get("bonusScores");

    if (!mcsRaw || !roundsRaw || !scoresRaw || !bonusRaw) {
      setError("Faltan datos. Asegúrate de exportar desde resultados.");
      return;
    }

    setMcs(JSON.parse(decodeURIComponent(mcsRaw)));
    setRounds(JSON.parse(decodeURIComponent(roundsRaw)));
    setScores(JSON.parse(decodeURIComponent(scoresRaw)));
    setBonusScores(JSON.parse(decodeURIComponent(bonusRaw)));
  }, [searchParams]);

  const allRoundIds: string[] = rounds.flatMap((r) =>
    r.doubleRound ? [`${r.id}-ida`, `${r.id}-vuelta`] : [r.id]
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Rondas revisadas</h1>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        allRoundIds.map((roundId) => {
          const round = rounds.find((r) => roundId.startsWith(r.id));
          const subtitle = roundId.includes("-ida")
            ? "Ida"
            : roundId.includes("-vuelta")
            ? "Vuelta"
            : "";

          return (
            <div key={roundId} className="bg-white shadow p-4 rounded-xl mb-4">
              <h2 className="text-lg font-semibold mb-1">{round?.name} {subtitle && `(${subtitle})`}</h2>
              <div className="grid grid-cols-2 gap-4">
                {mcs.map((mc) => {
                  const intervenciones = scores[`${roundId}-${mc.id}`] || [];

                  const bonus = Object.values(
                    bonusScores?.[`${roundId}-${mc.id}`] || {}
                  ).reduce((sum, val) => sum + (val ?? 0), 0);

                  return (
                    <div key={mc.id} className="bg-gray-100 p-3 rounded">
                      <h3 className="font-medium text-gray-700 mb-2">{mc.name}</h3>
                      <ul className="text-sm text-gray-600 mb-2">
                        {intervenciones.flatMap((intv, i) =>
                          intv.patterns.map((p, j) => (
                            <li key={`${i}-${j}`}>
                              Patrón {j + 1}: {p.value !== null 
                                ? `${p.value}${p.isResponse && p.value < 4 ? ' (+0.5R)' : ''}` 
                                : '-' }
                            </li>
                          ))
                        )}
                      </ul>
                      <p className="text-sm font-semibold text-blue-800">Bonus: {bonus}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      <div className="text-center mt-6">
        <button
          onClick={() => router.push("/resultados" + window.location.search)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Volver a resultados
        </button>
      </div>
    </div>
  );
}
