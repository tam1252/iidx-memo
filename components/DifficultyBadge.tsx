"use client";

import type { Difficulty } from "@/types";

const colors: Record<Difficulty, string> = {
  N: "bg-green-200 text-green-900",
  H: "bg-yellow-200 text-yellow-900",
  A: "bg-red-200 text-red-900",
  L: "bg-purple-200 text-purple-900",
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
