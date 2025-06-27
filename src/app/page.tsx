'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { FiPlus, FiTrash2, FiMic, FiTarget, FiEdit2, FiDownload, FiUpload } from 'react-icons/fi';
import Link from 'next/link';

interface Round {
  id: string;
  name: string;
  bonus: Record<string, boolean>;
  turnsPerMC: number;
  patternsPerTurn: number;
  doubleRound: boolean;
  editing?: boolean;
}

const roundSettings: Record<string, { turnsPerMC: number; patternsPerTurn: number }> = {
  '4x4': { turnsPerMC: 4, patternsPerTurn: 1 },
  '8x8': { turnsPerMC: 3, patternsPerTurn: 2 },
  '12x12': { turnsPerMC: 2, patternsPerTurn: 3 },
  'Easy Mode': { turnsPerMC: 1, patternsPerTurn: 6 },
  'Hard Mode': { turnsPerMC: 1, patternsPerTurn: 6 },
  'Random Mode': { turnsPerMC: 4, patternsPerTurn: 2 },
  'Beat Mode': { turnsPerMC: 1, patternsPerTurn: 4 },
  'Minuto Libre': { turnsPerMC: 1, patternsPerTurn: 8 },
  'Temática': { turnsPerMC: 1, patternsPerTurn: 4 },  
  'Acapella': { turnsPerMC: 3, patternsPerTurn: 3 },
  'Objetos': { turnsPerMC: 1, patternsPerTurn: 4 },
  'KickBack':{ turnsPerMC: 6, patternsPerTurn: 1 },
};

const allRounds = Object.keys(roundSettings);
const allBonus = ['FLOW', 'P. EN ESCENA', 'RESPUESTAS', 'TÉCNICAS'];

export default function Home() {
  const [mcs, setMcs] = useState<string[]>([]);
  const [newMc, setNewMc] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);

  const addMc = () => {
    if (newMc.trim() && !mcs.includes(newMc)) {
      setMcs([...mcs, newMc.trim()]);
      setNewMc('');
    }
  };

  const removeMc = (mc: string) => {
    setMcs(mcs.filter((name) => name !== mc));
  };

  const addRound = (roundName: string) => {
    if (rounds.find((r) => r.name === roundName)) return;

    const config = roundSettings[roundName];
    const round: Round = {
      id: crypto.randomUUID(),
      name: roundName,
      turnsPerMC: config.turnsPerMC,
      patternsPerTurn: config.patternsPerTurn,
      bonus: Object.fromEntries(allBonus.map((b) => [b, false])),
      doubleRound: false,
      editing: false,
    };

    setRounds([...rounds, round]);
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const toggleBonus = (id: string, bonus: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, bonus: { ...r.bonus, [bonus]: !r.bonus[bonus] } } : r
      )
    );
  };

  const updateTurns = (id: string, value: number, key: 'turnsPerMC' | 'patternsPerTurn') => {
    setRounds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const toggleDoubleRound = (id: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, doubleRound: !r.doubleRound } : r
      )
    );
  };

  const toggleEdit = (id: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, editing: !r.editing } : r
      )
    );
  };

  const handleExport = () => {
    const config = {
      mcs,
      rounds,
    };
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configuracion_batalla.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        if (result?.mcs && result?.rounds) {
          setMcs(result.mcs);
          setRounds(result.rounds);
        }
      } catch (error) {
        alert('Error al importar la configuración. Asegúrate de que sea un archivo válido.');
      }
    };
    reader.readAsText(file);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        <FiMic className="inline mr-2" /> Pensi Judges
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <FiMic /> Participantes
        </h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMc}
            onChange={(e) => setNewMc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMc()}
            placeholder="Escribe un MC..."
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            onClick={addMc}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FiPlus />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={handleExport}
            className="bg-gray-200 text-sm px-3 py-2 rounded flex items-center gap-1"
          >
            <FiDownload /> Exportar
          </button>

          <label className="bg-gray-200 text-sm px-3 py-2 rounded flex items-center gap-1 cursor-pointer">
            <FiUpload /> Importar
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <ul className="space-y-2">
          {mcs.map((mc, idx) => (
            <li
              key={mc}
              className="flex justify-between items-center bg-white shadow px-4 py-2 rounded"
            >
              <span>{idx + 1}. {mc}</span>
              <button
                onClick={() => removeMc(mc)}
                className="text-red-500 hover:text-red-700"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <FiTarget /> Rondas
        </h2>
        <select
          onChange={(e) => addRound(e.target.value)}
          defaultValue=""
          className="w-full border rounded px-4 py-2 mb-4"
        >
          <option value="" disabled>Selecciona una ronda</option>
          {allRounds.map((round) => (
            <option key={round} value={round}>{round}</option>
          ))}
        </select>

        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (active.id !== over?.id) {
              const oldIndex = rounds.findIndex((r) => r.id === active.id);
              const newIndex = rounds.findIndex((r) => r.id === over?.id);
              setRounds(arrayMove(rounds, oldIndex, newIndex));
            }
          }}
        >
          <SortableContext
            items={rounds.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {rounds.map((round, idx) => (
              <SortableRound
                key={round.id}
                round={round}
                index={idx}
                onDelete={() => removeRound(round.id)}
                onToggleBonus={toggleBonus}
                onUpdateTurns={updateTurns}
                onToggleDoubleRound={toggleDoubleRound}
                onToggleEdit={toggleEdit}
              />
            ))}
          </SortableContext>
        </DndContext>
      </section>

      <div className="mt-8 text-center">
        <Link
          href={{
            pathname: '/battle',
            query: {
              mcs: JSON.stringify(mcs.map((name, idx) => ({ name, id: `mc-${idx}` }))),
              rounds: JSON.stringify(rounds),
            },
          }}
          className="inline-block mt-8 text-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded font-semibold"
        >
          Iniciar Batalla →
        </Link>
      </div>
    </main>
  );
}

function SortableRound({
  round,
  index,
  onDelete,
  onToggleBonus,
  onUpdateTurns,
  onToggleDoubleRound,
  onToggleEdit,
}: {
  round: Round;
  index: number;
  onDelete: () => void;
  onToggleBonus: (id: string, bonus: string) => void;
  onUpdateTurns: (id: string, value: number, key: 'turnsPerMC' | 'patternsPerTurn') => void;
  onToggleDoubleRound: (id: string) => void;
  onToggleEdit: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: round.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // <--- esto es lo clave en móvil
    zIndex: 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white shadow rounded p-4 mb-4 active:cursor-grabbing"
    >
      <div className="flex justify-between mb-2 items-center">
        <h3 className="font-semibold text-blue-600">{index + 1}. {round.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEdit(round.id);
            }}
            className="text-gray-500 hover:text-blue-600"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {round.editing ? (
        <div className="flex gap-4 mb-2">
          <label className="text-sm">
            Intervenciones:
            <input
              type="number"
              min={1}
              value={round.turnsPerMC}
              onChange={(e) => onUpdateTurns(round.id, parseInt(e.target.value), 'turnsPerMC')}
              className="w-16 border rounded px-2 py-1 ml-1"
            />
          </label>
          <label className="text-sm">
            Patrones:
            <input
              type="number"
              min={1}
              value={round.patternsPerTurn}
              onChange={(e) => onUpdateTurns(round.id, parseInt(e.target.value), 'patternsPerTurn')}
              className="w-16 border rounded px-2 py-1 ml-1"
            />
          </label>
        </div>
      ) : (
        <div className="mb-2 text-sm text-gray-600">
          Intervenciones por MC: <strong>{round.turnsPerMC}</strong> · Patrones por intervención: <strong>{round.patternsPerTurn}</strong>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onToggleDoubleRound(round.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-all
            ${round.doubleRound ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Ida y vuelta
        </button>
        {Object.entries(round.bonus).map(([bonusName, active]) => (
          <button
            key={bonusName}
            onClick={() => onToggleBonus(round.id, bonusName)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all
              ${active ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {bonusName}
          </button>
        ))}
      </div>
    </div>
  );
}
