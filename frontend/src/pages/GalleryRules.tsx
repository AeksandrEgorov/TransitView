import { GALLERY_RULES } from "../config/rulesData";
import { type Rule } from "../types/rule";
import { AlertTriangle, Ban, Info, FileText } from "lucide-react";

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
        <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Reeglid
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Fotode lisamise reeglid
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            TransitView galerii kvaliteedi tagamiseks peavad kõik üleslaaditud fotod vastama järgmistele nõuetele
            </p>
        </div>
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
                        {rule.description}
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