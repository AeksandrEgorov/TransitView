// This file has the manage user card component.

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  Crown,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";

import type { ManageUserOption } from "../../../config/manageApi";

export type ManageUserCardData = ManageUserOption & {
  created_at?: string | null;

  vehicles_total?: number;
  vehicles_pending?: number;
  vehicles_confirmed?: number;
  vehicles_rejected?: number;

  photos_total?: number;
  photos_pending?: number;
  photos_confirmed?: number;
  photos_rejected?: number;
};

type ManageUser = ManageUserCardData;
function formatDate(value?: string | null) {
  if (!value) {
    return "Teadmata";
  }

  return new Date(value).toLocaleDateString("et-EE");
}

function formatRole(role?: string | null) {
  if (role === "Administraator") {
    return "Administraator";
  }

  if (role === "Andmebaasi_toimetaja") {
    return "Andmebaasi toimetaja";
  }

  return "Kasutaja";
}

function getRoleBadgeClass(role?: string | null) {
  if (role === "Administraator") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (role === "Andmebaasi_toimetaja") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getRoleIcon(role?: string | null) {
  if (role === "Administraator") {
    return <Crown size={16} />;
  }

  if (role === "Andmebaasi_toimetaja") {
    return <ShieldCheck size={16} />;
  }

  return <UserCheck size={16} />;
}

function getInitials(user: ManageUser) {
  const source = user.username || user.email || "U";

  return (
    source
      .split(/[.\s_-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function getCount(user: ManageUser, key: keyof ManageUser) {
  const value = user[key];

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getUserVehiclesTotal(user: ManageUser) {
  return getCount(user, "vehicles_total");
}

function getUserPhotosTotal(user: ManageUser) {
  return getCount(user, "photos_total");
}

function hasRelatedContent(user: ManageUser) {
  return getUserVehiclesTotal(user) > 0 || getUserPhotosTotal(user) > 0;
}

function getDeleteBlockedMessage(user: ManageUser) {
  const vehiclesTotal = getUserVehiclesTotal(user);
  const photosTotal = getUserPhotosTotal(user);

  if (vehiclesTotal > 0 && photosTotal > 0) {
    return "Kasutajat ei saa kustutada, sest tal on seotud sõidukid ja fotod. Kustuta need enne, kui soovid kasutaja eemaldada.";
  }

  if (vehiclesTotal > 0) {
    return "Kasutajat ei saa kustutada, sest tal on seotud sõidukid. Kustuta need enne, kui soovid kasutaja eemaldada.";
  }

  return "Kasutajat ei saa kustutada, sest tal on seotud fotod. Kustuta need enne, kui soovid kasutaja eemaldada.";
}

function UserMiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserContentStats({
  title,
  icon,
  total,
  pending,
  confirmed,
  rejected,
}: {
  title: string;
  icon: ReactNode;
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 ring-1 ring-slate-200">
          {icon}
        </div>

        <h4 className="text-sm font-extrabold text-slate-950">{title}</h4>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UserMiniStat
          label="Kokku"
          value={total}
          icon={<BarChart3 size={16} />}
        />

        <UserMiniStat
          label="Ootel"
          value={pending}
          icon={<Clock3 size={16} />}
        />

        <UserMiniStat
          label="Kinnitatud"
          value={confirmed}
          icon={<CheckCircle2 size={16} />}
        />

        <UserMiniStat
          label="Tagasi"
          value={rejected}
          icon={<XCircle size={16} />}
        />
      </div>
    </div>
  );
}

interface ManageUserCardProps {
  user: ManageUser;
  index: number;
  onEdit: (user: ManageUser) => void;
  onDelete: (user: ManageUser) => void;
}

function ManageUserCard({
  user,
  index,
  onEdit,
  onDelete,
}: ManageUserCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  const isAdmin = user.role === "Administraator";
  const isDeleteBlocked = hasRelatedContent(user);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, Math.min(index, 8) * 45);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [index, user.user_id]);

  return (
    <article
      className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.10)] ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="grid gap-0 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex items-center justify-center bg-slate-50 p-6 ring-1 ring-slate-100 xl:min-h-full">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-950 text-3xl font-extrabold text-white shadow-sm ring-1 ring-slate-900">
            {getInitials(user)}
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="truncate text-2xl font-extrabold text-slate-950">
                  {user.username || "Nimetu kasutaja"}
                </h3>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 ${getRoleBadgeClass(
                    user.role
                  )}`}
                >
                  {getRoleIcon(user.role)}
                  {formatRole(user.role)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Mail size={16} />
                  {user.email || "E-post puudub"}
                </span>

                <span>Lisatud {formatDate(user.created_at)}</span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Sõidukeid:{" "}
                <span className="font-bold text-slate-800">
                  {getUserVehiclesTotal(user)}
                </span>{" "}
                · Fotosid:{" "}
                <span className="font-bold text-slate-800">
                  {getUserPhotosTotal(user)}
                </span>
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 2xl:w-auto 2xl:min-w-[320px]">
              {isAdmin ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 ring-1 ring-amber-100">
                  Administraatorit ei saa muuta ega kustutada.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 2xl:justify-end">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="inline-flex min-w-[115px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 2xl:flex-none"
                    >
                      <Pencil size={16} />
                      Muuda
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={isDeleteBlocked}
                      className="inline-flex min-w-[115px] flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 2xl:flex-none"
                    >
                      <Trash2 size={16} />
                      Kustuta
                    </button>
                  </div>

                  {isDeleteBlocked && (
                    <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                      {getDeleteBlockedMessage(user)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <UserContentStats
              title="Sõidukid"
              icon={<BarChart3 size={18} />}
              total={getCount(user, "vehicles_total")}
              pending={getCount(user, "vehicles_pending")}
              confirmed={getCount(user, "vehicles_confirmed")}
              rejected={getCount(user, "vehicles_rejected")}
            />

            <UserContentStats
              title="Fotod"
              icon={<Camera size={18} />}
              total={getCount(user, "photos_total")}
              pending={getCount(user, "photos_pending")}
              confirmed={getCount(user, "photos_confirmed")}
              rejected={getCount(user, "photos_rejected")}
            />
          </div>
        </div>
      </div>
    </article>
  );
}


export default ManageUserCard;
