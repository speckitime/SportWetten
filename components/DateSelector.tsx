"use client";

interface DateSelectorProps {
  selected: string;
  onChange: (date: string) => void;
}

export default function DateSelector({ selected, onChange }: DateSelectorProps) {
  return (
    <div className="flex gap-2">
      {["today", "tomorrow", "week"].map((d) => {
        const labels: Record<string, string> = {
          today: "Heute",
          tomorrow: "Morgen",
          week: "Diese Woche",
        };
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selected === d
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {labels[d]}
          </button>
        );
      })}
    </div>
  );
}
