// app/components/sections/ConditionNav.tsx
"use client";

import Link from "next/link";
import { Battery, Zap, Feather } from "lucide-react";
import { TAG_ORDER, TAGS } from "@/app/tags/tagConfig";

const Icon = ({ name }: { name: "feather" | "battery" | "zap" }) => {
  if (name === "feather") return <Feather className="w-6 h-6 mb-2" />;
  if (name === "battery") return <Battery className="w-6 h-6 mb-2" />;
  return <Zap className="w-6 h-6 mb-2" />;
};

export default function ConditionNav() {
  return (
    <div className="py-6">
      <h2 className="text-lg font-semibold mb-4">条件から選ぶ</h2>
      <div className="grid grid-cols-3 gap-3">
        {TAG_ORDER.map((key) => {
          const t = TAGS[key];
          return (
            <Link
              key={t.key}
              href={`/tags/${t.key}`}
              className="flex flex-col items-center justify-center rounded-xl border p-4 hover:bg-gray-50 transition"
            >
              <Icon name={t.icon} />
              <span className="text-sm font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
