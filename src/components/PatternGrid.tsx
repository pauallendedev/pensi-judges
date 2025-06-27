interface Props {
  mcName: string;
  totalPatterns: number;
}

export default function PatternGrid({ mcName, totalPatterns }: Props) {
  return (
    <div className="mb-4">
      <h3 className="font-medium text-gray-700 mb-2">{mcName}</h3>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: totalPatterns }).map((_, idx) => (
          <div
            key={idx}
            className="w-10 h-10 bg-white border rounded shadow flex items-center justify-center text-sm hover:bg-blue-100 cursor-pointer"
          >
            {idx + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
