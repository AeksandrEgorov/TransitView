// This page explains the gallery and upload rules.
// It renders the rule data into readable sections with icons and status colors.

import { GALLERY_RULES } from "../data/rulesData";
import { type Rule } from "../types/rule";
import { AlertTriangle, Ban, Info, FileText } from "lucide-react";
import PageHero from "../components/ui/PageHero";

const formatDescription = (text: string) => {
  const parts = text.split(/(NB!|(?:\d+\.)+(?:\d+\.)?|\(vt\..*?\))/g);
  return parts.map((part, i) => {
    if (part === "NB!") {
      return (
        <strong key={i} className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[11px] leading-none border border-rose-200 mr-1 shadow-sm">
          NB!
        </strong>
      );
    }
    if (/^(\d+\.)+$/.test(part)) {
      return (
        <span key={i} className="font-bold text-slate-900 underline decoration-blue-500/30 underline-offset-2 mr-1">
          {part}
        </span>
      );
    }
    if (part.startsWith('(vt.')) {
      return (
        <span key={i} className="italic text-blue-600/80 font-medium decoration-blue-200 underline-offset-4 hover:text-blue-700 transition-colors cursor-default">
          {part}
        </span>
      );
    }
    return part;
  });
};
function GalleryRules() {
    const variantStyles = {
        danger: "border-rose-200 bg-rose-50/50 text-rose-900 shadow-sm",
        attention: "border-amber-200 bg-amber-50/50 text-amber-900 shadow-sm",
        info: "border-blue-200 bg-blue-50/50 text-blue-900 shadow-sm",
        default: "border-slate-200 bg-slate-50/50 text-slate-900 shadow-sm",
    };
    const iconMap = {
        danger: <Ban className="w-6 h-6 shrink-0 text-rose-600" />,
        attention: <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />,
        info: <Info className="w-6 h-6 shrink-0 text-blue-600" />,
        default: <FileText className="w-6 h-6 shrink-0 text-slate-600" />,
    };
    return (
        <div className="space-y-8 p-4 sm:p-0">
          <PageHero
            eyebrow="Reeglid"
            title="TransitView saidi reeglid"
            description="TransitView keskkonna kvaliteedi, korra ja turvalisuse tagamiseks peavad kõik kasutajad ning lisatud sisu vastama üldistele eeskirjadele ja nõuetele."
          />
        <div className="grid gap-6 sm:grid-cols-2">
            {GALLERY_RULES.map((rule: Rule) => {
            const currentStyle = variantStyles[rule.variant as keyof typeof variantStyles] || variantStyles.default;
            const currentIcon = iconMap[rule.variant as keyof typeof iconMap] || iconMap.default;
            return (
                <div 
                key={rule.id} 
                className={`group rounded-2xl border p-6 transition-all hover:shadow-md ${currentStyle}`}
                >
                <div className="flex items-start gap-4">
                    <span className="text-xl shrink-0" role="img" aria-hidden="true">
                    {currentIcon}
                    </span>
                    <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-2">
                        {rule.title}
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700/90">
                        {formatDescription(rule.description)}
                    </p>
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
            Reeglid on viimati uuendatud: 21. aprill 2026. <br />
            </p>
        </div>
    </div>
  );
}
export default GalleryRules;
