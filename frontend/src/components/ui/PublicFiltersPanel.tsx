// This file has the public filters panel component.

import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  activeFiltersCount: number;
  onReset: () => void;
  children: ReactNode;
}

function PublicFiltersPanel({
  title,
  description,
  activeFiltersCount,
  onReset,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Filtrid
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {activeFiltersCount > 0 && (
            <div className="inline-flex items-center justify-center rounded-2xl bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
              Aktiivsed filtrid: {activeFiltersCount}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <SlidersHorizontal size={17} />
            {isOpen ? "Peida filtrid" : "Näita filtreid"}
            {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-slate-50 p-5">
          {children}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={17} />
                Lähtesta filtrid
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PublicFiltersPanel;