"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ScorePicker from "@/components/ScorePicker";
import React from "react";
import { useRouter } from "next/navigation";

interface MC {
  name: string;
  id: string;
}

interface Round {
  id: string;
  name: string;
  turnsPerMC: number;
  patternsPerTurn: number;
  doubleRound: boolean;
  bonus: Record<string, boolean>;
}

interface Pattern {
  value: number | null;
  isResponse?: boolean;
}

interface Intervention {
  mcId: string;
  patterns: Pattern[];
}

export default function BattlePage() {
  const searchParams = useSearchParams();
  const [mcs] = useState<MC[]>(() =>
    JSON.parse(searchParams.get("mcs") || "[]")
  );
  const [rounds] = useState<Round[]>(() =>
    JSON.parse(searchParams.get("rounds") || "[]")
  );

  const [scores, setScores] = useState<Record<string, Intervention[]>>({});
  const [bonusScores, setBonusScores] = useState<
    Record<string, Record<string, number>>
  >({});
  const [roundKeys, setRoundKeys] = useState<string[]>([]);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [pickerCoords, setPickerCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pickerValue, setPickerValue] = useState<number | null>(null);
  const [pickerCallback, setPickerCallback] = useState<
    ((val: number) => void) | null
  >(null);

  useEffect(() => {
    const initScores: Record<string, Intervention[]> = {};
    const initBonus: Record<string, Record<string, number>> = {};
    const keys: string[] = [];

    rounds.forEach((round) => {
      const ids = round.doubleRound
        ? [`${round.id}-ida`, `${round.id}-vuelta`]
        : [round.id];

      ids.forEach((rid) => {
        keys.push(rid);
        mcs.forEach((mc) => {
          const interventions: Intervention[] = [];
          for (let t = 0; t < round.turnsPerMC; t++) {
            interventions.push({
              mcId: mc.id,
              patterns: Array.from({ length: round.patternsPerTurn }, () => ({
                value: null,
              })),
            });
          }
          initScores[`${rid}-${mc.id}`] = interventions;

          const bonus: Record<string, number> = {};
          Object.entries(round.bonus).forEach(([key, active]) => {
            if (active && key !== "RESPUESTAS") bonus[key] = 0;
          });
          initBonus[`${rid}-${mc.id}`] = bonus;
        });
      });
    });

    setScores(initScores);
    setBonusScores(initBonus);
    setRoundKeys(keys);
  }, [mcs, rounds]);

  const router = useRouter();

  const handleEndBattle = () => {
    const query = new URLSearchParams({
      mcs: encodeURIComponent(JSON.stringify(mcs)),
      rounds: encodeURIComponent(JSON.stringify(rounds)),
      scores: encodeURIComponent(JSON.stringify(scores)),
      bonusScores: encodeURIComponent(JSON.stringify(bonusScores)),
    }).toString();

    router.push(`/resultados?${query}`);
  };

  const handlePatternChange = (
    roundId: string,
    mcId: string,
    turnIdx: number,
    patternIdx: number,
    value: number
  ) => {
    setScores((prev) => {
      const key = `${roundId}-${mcId}`;
      const updated = [...prev[key]];
      updated[turnIdx].patterns[patternIdx].value = value;
      return { ...prev, [key]: updated };
    });
    closePicker();
  };

  const toggleResponse = (
    roundId: string,
    mcId: string,
    turnIdx: number,
    patternIdx: number
  ) => {
    setScores((prev) => {
      const key = `${roundId}-${mcId}`;
      const updated = [...prev[key]];
      const updatedPatterns = [...updated[turnIdx].patterns];
      const pattern = { ...updatedPatterns[patternIdx], isResponse: !updated[turnIdx].patterns[patternIdx].isResponse };
      updatedPatterns[patternIdx] = pattern;
      updated[turnIdx] = { ...updated[turnIdx], patterns: updatedPatterns };

      updated[turnIdx].patterns[patternIdx] = pattern; // Lo reasignamos
      console.log(
        `Toggled response: ${roundId} ${mcId} turn ${turnIdx} pattern ${patternIdx} →`,
        pattern.isResponse
      );
      return { ...prev, [key]: updated };
    });
  };

  const openPicker = (
    e: React.MouseEvent<HTMLButtonElement>,
    currentValue: number | null,
    onSelect: (val: number) => void
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const pickerWidth = 120; // Ancho aproximado del ScorePicker
    const screenWidth = window.innerWidth;

    let x = rect.left + rect.width / 2 - pickerWidth / 2;
    if (x < 8) x = 8; // margen izquierdo
    if (x + pickerWidth > screenWidth - 8) x = screenWidth - pickerWidth - 8; // margen derecho

    setPickerCoords({ x, y: rect.bottom });
    setPickerValue(currentValue ?? 0);
    setPickerCallback(() => onSelect);
  };

  const closePicker = () => {
    setPickerCoords(null);
    setPickerValue(null);
    setPickerCallback(null);
  };

  const calculateTotal = (roundId: string, mcId: string) => {
    const key = `${roundId}-${mcId}`;
    const baseTotal = (scores[key] || []).reduce((total, intervention) => {
      return (
        total +
        intervention.patterns.reduce((sum, p) => {
          const base = p.value ?? 0;
          const extra = p.isResponse && base < 4 ? 0.5 : 0;
          return sum + Math.min(base + extra, 4);
        }, 0)
      );
    }, 0);
    const bonusTotal = Object.values(bonusScores[key] || {}).reduce(
      (sum, val) => sum + val,
      0
    );
    return baseTotal + bonusTotal;
  };

  const renderRoundCard = (roundId: string) => {
    const baseId = roundId.replace(/-(ida|vuelta)/, "");
    const round = rounds.find((r) => r.id === baseId);
    if (!round) return null;

    const subtitle = roundId.includes("ida")
      ? "Ida"
      : roundId.includes("vuelta")
      ? "Vuelta"
      : "";

    const activeBonuses = Object.entries(round.bonus).filter(
      ([key, active]) => active && key !== "RESPUESTAS"
    );

    return (
      <div
        key={roundId}
        className="mb-8 border rounded-lg p-6 shadow-sm bg-white overflow-x-auto"
      >
        <h2 className="text-center text-lg font-medium text-gray-700 mb-4">
          {round.name}{" "}
          {subtitle && <span className="text-yellow-600">({subtitle})</span>}
        </h2>

        {mcs.map((mc) => (
          <div key={mc.id} className="mb-6">
            <h3 className="font-medium text-gray-700 mb-1">{mc.name}</h3>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex flex-wrap gap-1 max-w-full">
                {(scores[`${roundId}-${mc.id}`] || []).map(
                  (intervention, i) => (
                    <div key={i} className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-1 max-w-full">
                      {intervention.patterns.map((p, j) => (
                        <div key={j} className="relative">
                          <button
                            className={`w-12 h-12 rounded-lg text-base font-semibold border flex items-center justify-center
                                ${
                                  p.value === 4
                                    ? "bg-yellow-400 text-black"
                                    : p.value === 3 || p.value === 3.5
                                    ? "bg-red-600 text-white"
                                    : p.value === 2 || p.value === 2.5
                                    ? "bg-gray-400 text-white"
                                    : p.value === 1 || p.value === 1.5
                                    ? "bg-gray-800 text-white"
                                    : p.value === 0.5 || p.value === 0
                                    ? "bg-white text-black"
                                    : "bg-white text-gray-400"
                                }`}
                            onClick={(e) =>
                              openPicker(e, p.value, (val) =>
                                handlePatternChange(roundId, mc.id, i, j, val)
                              )
                            }
                          >
                            {p.value ?? j + 1}
                          </button>

                          {round?.bonus["RESPUESTAS"] && (
                            <>
                              {console.log(`Render botón R: [${roundId}-${mc.id}] turn ${i}, pattern ${j} →`, p.isResponse)}
                              <button
                                onClick={() => toggleResponse(roundId, mc.id, i, j)}
                                className={`absolute -top-3 -right-3 w-8 h-8 text-sm font-bold rounded-full border-2 shadow-sm
                                flex items-center justify-center transition-colors duration-150
                                ${p.isResponse ? "bg-green-500 text-white border-green-600" : "bg-gray-200 text-gray-700 border-gray-300"}`}
                                aria-label="Marcar como respuesta"
                              >
                                R
                              </button>
                            </>
                          )}

                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="flex gap-2 justify-end sm:justify-center mt-2">
                {activeBonuses.map(([bonus]) => {
                  const isMany = activeBonuses.length >= 4;
                  return (
                    <div
                      key={bonus}
                      className="flex flex-col items-center gap-0.5"
                    >
                      <span
                        className={`text-xs ${
                          isMany ? "text-[10px]" : "text-xs"
                        } text-gray-500`}
                      >
                        {bonus.replace(" ", "\n")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={2}
                        step={0.5}
                        value={bonusScores[`${roundId}-${mc.id}`]?.[bonus] ?? 0}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val)) val = 0;
                          if (![0, 0.5, 1, 1.5, 2].includes(val)) return;
                          setBonusScores((prev) => ({
                            ...prev,
                            [`${roundId}-${mc.id}`]: {
                              ...prev[`${roundId}-${mc.id}`],
                              [bonus]: val,
                            },
                          }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            setBonusScores((prev) => ({
                              ...prev,
                              [`${roundId}-${mc.id}`]: {
                                ...prev[`${roundId}-${mc.id}`],
                                [bonus]: 0,
                              },
                            }));
                          }
                        }}
                        className={`w-10 h-10 text-center rounded bg-blue-100 border border-blue-300 font-semibold ${
                          isMany ? "text-xs px-2" : "text-sm px-3"
                        }`}
                      />
                    </div>
                  );
                })}

                <div className="flex flex-col items-center gap-0.5 ml-2">
                  <span className="text-xs text-gray-500">Total</span>
                  <div className="w-10 h-10 bg-gray-300 text-black font-bold rounded flex items-center justify-center">
                    {calculateTotal(roundId, mc.id)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const roundId = roundKeys[currentViewIndex] || "";
  const round = rounds.find(
    (r) => r.id === roundId.replace(/-(ida|vuelta)/, "")
  );
  const roundIndex = currentViewIndex + 1;
  const totalRounds = roundKeys.length;
  const part = roundId.includes("ida")
    ? "Ida"
    : roundId.includes("vuelta")
    ? "Vuelta"
    : "";

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-center mb-1">Batalla en curso</h1>
      {round && (
        <div className="mb-6">
          <p className="text-lg font-medium text-center text-gray-700">
            <span className="text-blue-600">{round.name}</span>{" "}
            <span className="text-yellow-600">({part})</span> — Ronda{" "}
            {roundIndex}/{totalRounds}
          </p>
        </div>
      )}

      {roundKeys.length > 0 && renderRoundCard(roundKeys[currentViewIndex])}

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentViewIndex((i) => Math.max(0, i - 1))}
          disabled={currentViewIndex === 0}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => {
            if (currentViewIndex === roundKeys.length - 1) {
              handleEndBattle();
            } else {
              setCurrentViewIndex((i) => i + 1);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {currentViewIndex === roundKeys.length - 1
            ? "Acabar batalla"
            : "Siguiente"}
        </button>
      </div>

      {pickerCoords && pickerValue !== null && pickerCallback && (
        <ScorePicker
          position={pickerCoords}
          _={pickerValue}
          onSelect={(val) => {
            pickerCallback(val);
            closePicker();
          }}
          onClose={closePicker}
        />
      )}
    </div>
  );
}
