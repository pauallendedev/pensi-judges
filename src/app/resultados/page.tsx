"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

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

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mcs, setMcs] = useState<MC[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [scores, setScores] = useState<Record<string, Intervention[]>>({});
  const [bonusScores, setBonusScores] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    try {
      const mcsRaw = searchParams.get("mcs");
      const roundsRaw = searchParams.get("rounds");
      const scoresRaw = searchParams.get("scores");
      const bonusRaw = searchParams.get("bonusScores");
      

      console.log({ mcsRaw, roundsRaw, scoresRaw, bonusRaw });

      if (!mcsRaw || !roundsRaw || !scoresRaw || !bonusRaw) {
        console.warn("Missing required search parameters");
        return;
      }

      setMcs(JSON.parse(decodeURIComponent(mcsRaw)));
      setRounds(JSON.parse(decodeURIComponent(roundsRaw)));
      setScores(JSON.parse(decodeURIComponent(scoresRaw)));
      setBonusScores(JSON.parse(decodeURIComponent(bonusRaw)));
    } catch (err) {
      console.error("Error parsing params:", err);
    }
  }, [searchParams]);

  const calculateTotal = (roundId: string, mcId: string) => {
    const base = (scores[`${roundId}-${mcId}`] || []).reduce((total, interv) =>
      total + interv.patterns.reduce((sum, p) => {
        const baseVal = p.value ?? 0;
        const responseBonus = p.isResponse && baseVal < 4 ? 0.5 : 0;
        return sum + baseVal + responseBonus;
      }, 0)
    , 0);

    const bonus = Object.values(bonusScores?.[`${roundId}-mc-${mcId.split("-")[1]}`] || {}).reduce(
    (sum, val) => sum + (val ?? 0),
    0
    );

    return base + bonus;
  };

  const totals: Record<string, number> = {};
  const allRoundIds: string[] = rounds.flatMap((r) =>
    r.doubleRound ? [`${r.id}-ida`, `${r.id}-vuelta`] : [r.id]
  );

  mcs.forEach((mc) => {
    totals[mc.id] = allRoundIds.reduce((sum, rid) => sum + calculateTotal(rid, mc.id), 0);
  });

  const exportToExcel = () => {
    const data = [];

    for (const rid of allRoundIds) {
      const round = rounds.find((r) => rid.startsWith(r.id));
      const label = round ? `${round.name}${rid.includes("-ida") ? " (Ida)" : rid.includes("-vuelta") ? " (Vuelta)" : ""}` : rid;

      for (const mc of mcs) {
        data.push({
          Ronda: label,
          MC: mc.name,
          Total: calculateTotal(rid, mc.id),
        });
      }
    }

    for (const mc of mcs) {
      data.push({ Ronda: "TOTAL", MC: mc.name, Total: totals[mc.id] });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "resultados_batalla.xlsx");
  };

  const ganador =
    mcs.length >= 2
      ? totals[mcs[0].id] === totals[mcs[1].id]
        ? null
        : totals[mcs[0].id] > totals[mcs[1].id]
          ? mcs[0]
          : mcs[1]
      : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Resultados de la batalla</h1>

      {allRoundIds.map((roundId) => {
        const round = rounds.find((r) => roundId.startsWith(r.id));
        const title = `${round?.name || roundId}`;
        const subtitle = roundId.includes("-ida")
          ? "Ida"
          : roundId.includes("-vuelta")
          ? "Vuelta"
          : "";

        return (
          <div key={roundId} className="bg-white rounded-xl shadow p-4 mb-4">
            <h2 className="text-xl font-semibold text-center">
              {mcs[0].name} vs {mcs[1].name}
            </h2>
            <p className="text-center text-sm text-gray-500 mb-2">
              {title} {subtitle && `(${subtitle})`}
            </p>
            <div className="flex justify-around gap-4">
              {mcs.map((mc) => (
                <div
                  key={mc.id}
                  className="flex flex-col items-center gap-1 border rounded-lg p-3 w-full bg-gray-50"
                >
                  <span className="text-sm text-gray-600 font-medium">{mc.name}</span>
                  <div className="text-xl font-bold bg-gray-200 rounded px-4 py-2">
                    {calculateTotal(roundId, mc.id)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-6 bg-green-100 rounded-xl p-4 shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2">Puntuación Total</h2>
        <div className="flex justify-around gap-4">
          {mcs.map((mc) => (
            <div key={mc.id} className="text-center">
              <p className="text-gray-600 font-medium">{mc.name}</p>
              <div className="text-2xl font-bold text-green-800">{totals[mc.id]}</div>
            </div>
          ))}
        </div>
        {ganador && (
          <p className="mt-4 text-green-700 font-semibold text-lg">
            🏆 El ganador es {ganador.name} con {totals[ganador.id]} puntos
          </p>
        )}
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={exportToExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exportar a Excel
        </button>
        <button
          onClick={() => router.push(`/battle/readonly?mcs=${encodeURIComponent(JSON.stringify(mcs))}&rounds=${encodeURIComponent(JSON.stringify(rounds))}&scores=${encodeURIComponent(JSON.stringify(scores))}&bonusScores=${encodeURIComponent(JSON.stringify(bonusScores))}`)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Ver rondas
        </button>
      </div>
    </div>
  );
}
