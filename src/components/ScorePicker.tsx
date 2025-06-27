import { useEffect, useRef, useState } from 'react';

interface Props {
  position: { x: number; y: number };
  _: number;
  onSelect: (val: number) => void;
  onClose: () => void;
}

export default function ScorePicker({ position, _, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    top: position.y,
    left: position.x,
    transform: 'translate(-50%, 4px)', // por defecto, centrado debajo del botón
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { offsetWidth, offsetHeight } = el;

    let left = position.x;
    let top = position.y;
    let transform = 'translate(-50%, 4px)';

    // Ajustes si se desborda horizontalmente
    const overflowRight = position.x + offsetWidth / 2 > window.innerWidth;
    const overflowLeft = position.x - offsetWidth / 2 < 0;

    if (overflowRight) {
      left = window.innerWidth - offsetWidth - 8; // margen derecho
      transform = 'translate(0, 4px)';
    } else if (overflowLeft) {
      left = 8; // margen izquierdo
      transform = 'translate(0, 4px)';
    }

    // Ajustes si se desborda verticalmente
    if (top + offsetHeight > window.innerHeight) {
      top = position.y - offsetHeight - 4;
      transform = transform.replace('4px', '-4px');
    }

    setStyle({ top, left, transform });
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const values = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

  return (
    <div
      ref={ref}
      className="fixed z-50 grid grid-cols-3 gap-1 bg-white border rounded shadow-md p-2 transition-all"
      style={style}
    >
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`w-10 h-10 rounded text-sm font-semibold
            ${v === 4 ? 'bg-yellow-400 text-black' :
              v === 3 ? 'bg-red-600 text-white' :
              v === 3.5 ? 'bg-red-600 text-white' :
              v === 2 ? 'bg-gray-400 text-white border border-gray-200' :
              v === 2.5 ? 'bg-gray-400 text-white border border-gray-200' :
              v === 0.5 ? 'bg-white text-black border' :
              v === 0 ? 'bg-white text-black border' :
              'bg-gray-800 text-white'}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
