"use client";

import type { Difficulty } from "@/types";

const colors: Record<Difficulty, string> = {
  N: "bg-green-600 text-white",
  H: "bg-yellow-500 text-black",
  A: "bg-red-600 text-white",
  L: "bg-purple-700 text-white",
};

const labels: Record<Difficulty, string> = {
  N: "N",
  H: "H",
  A: "A",
  L: "L",
};

interface Props {
  difficulty: Difficulty;
  level?: number;
  selected?: boolean;
  onClick?: () => void;
}

export default function DifficultyBadge({ difficulty, level, selected, onClick }: Props) {
  const base = colors[difficulty];
  const ring = selected ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900" : "";
  const cursor = onClick ? "cursor-pointer" : "";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-bold ${base} ${ring} ${cursor}`}
      onClick={onClick}
    >
      {labels[difficulty]}
      {level !== undefined && <span className="text-xs font-normal">{level}</span>}
    </span>
  );
}
