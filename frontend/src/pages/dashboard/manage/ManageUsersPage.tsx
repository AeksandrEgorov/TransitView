import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  Crown,
  Database,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";
import DashboardStatCard from "../../../components/dashboard/DashboardStatCard";
import DashboardFiltersPanel from "../../../components/dashboard/DashboardFiltersPanel";
import CreateUserModal from "../../../components/modals/CreateUserModal";
import UpdateUserModal from "../../../components/modals/UpdateUserModal";
import DeleteConfirmModal from "../../../components/modals/DeleteConfirmModal";

import {
  deleteManageUser,
  getManageUserById,
  getManageUsers,
  type ManageUserOption,
} from "../../../config/manageApi";

import { useToast } from "../../../hooks/useToast";

type UserRole = "Kasutaja" | "Andmebaasi_toimetaja" | "Administraator";

type ManageUser = ManageUserOption & {
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

interface UserFilterState {
  search: string;
  role: "" | UserRole;
}

const initialFilters: UserFilterState = {
  search: "",
  role: "",
};

const FILTER_DEBOUNCE_MS = 400;
const limit = 10;

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

function getDeleteErrorMessage(error: unknown) {
  const responseMessage = (
    error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    }
  )?.response?.data?.message;

  if (
    responseMessage ===
    "User cannot be deleted because they have related vehicles or photos"
  ) {
    return "Kasutajat ei saa kustutada, sest tal on seotud sõidukid või fotod. Kustuta need enne, kui soovid kasutaja eemaldada.";
  }

  if (responseMessage) {
    return responseMessage;
  }

  return "Kasutajat ei õnnestunud kustutada.";
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

function UsersFilters({
  filters,
  onChange,
}: {
  filters: UserFilterState;
  onChange: <K extends keyof UserFilterState>(
    key: K,
    value: UserFilterState[K]
  ) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.6fr)]">
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Otsing</span>

        <div className="mt-2 flex rounded-2xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
          <div className="flex items-center px-4 text-slate-400">
            <Search size={18} />
          </div>

          <input
            type="text"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Otsi nime või e-posti järgi..."
            className="min-w-0 flex-1 rounded-2xl px-0 py-3 pr-4 text-sm font-medium text-slate-800 outline-none"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">Roll</span>

        <select
          value={filters.role}
          onChange={(event) =>
            onChange("role", event.target.value as UserFilterState["role"])
          }
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Kõik rollid</option>
          <option value="Kasutaja">Kasutaja</option>
          <option value="Andmebaasi_toimetaja">Andmebaasi toimetaja</option>
          <option value="Administraator">Administraator</option>
        </select>
      </label>
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

function ManageUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<ManageUser[]>([]);
  const [filters, setFilters] = useState<UserFilterState>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const [userToEdit, setUserToEdit] = useState<ManageUser | null>(null);
  const [isUpdateUserOpen, setIsUpdateUserOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState<ManageUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);

      const matchesRole = !filters.role || user.role === filters.role;

      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearch, filters.role]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / limit), 1);

  const pageUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page]);

  const activeFiltersCount = useMemo(() => {
    return [filters.search.trim(), filters.role].filter(Boolean).length;
  }, [filters]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      regular: users.filter((user) => user.role === "Kasutaja").length,
      editors: users.filter((user) => user.role === "Andmebaasi_toimetaja")
        .length,
      admins: users.filter((user) => user.role === "Administraator").length,
    };
  }, [users]);

  async function loadUsers() {
    try {
      setIsLoading(true);

      const data = await getManageUsers({
        page: 1,
        limit: 1000,
      });

      setUsers(data.items as ManageUser[]);
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kasutajate laadimine ebaõnnestus",
        message: "Kasutajate nimekirja ei õnnestunud laadida.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.role]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter<K extends keyof UserFilterState>(
    key: K,
    value: UserFilterState[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setDebouncedSearch("");
    setPage(1);
  }

  function handleUserCreated() {
    setIsCreateUserOpen(false);
    loadUsers();
  }

  async function handleOpenUpdateUserModal(user: ManageUser) {
    if (user.role === "Administraator") {
      showToast({
        variant: "error",
        title: "Muutmine pole lubatud",
        message: "Administraatori kontot ei saa muuta.",
      });

      return;
    }

    try {
      setIsEditLoading(true);

      const detailedUser = await getManageUserById(user.user_id);

      setUserToEdit(detailedUser as ManageUser);
      setIsUpdateUserOpen(true);
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kasutaja laadimine ebaõnnestus",
        message: "Kasutaja muutmise vormi jaoks ei õnnestunud andmeid laadida.",
      });
    } finally {
      setIsEditLoading(false);
    }
  }

  function handleCloseUpdateUserModal() {
    setIsUpdateUserOpen(false);
    setUserToEdit(null);
  }

  function handleUserUpdated() {
    setIsUpdateUserOpen(false);
    setUserToEdit(null);
    loadUsers();
  }

  function handleOpenDeleteUserModal(user: ManageUser) {
    if (user.role === "Administraator") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Administraatori kontot ei saa kustutada.",
      });

      return;
    }

    if (hasRelatedContent(user)) {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: getDeleteBlockedMessage(user),
      });

      return;
    }

    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteUserModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  }

  async function handleConfirmDeleteUser() {
    if (!userToDelete) {
      return;
    }

    if (userToDelete.role === "Administraator") {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: "Administraatori kontot ei saa kustutada.",
      });

      return;
    }

    if (hasRelatedContent(userToDelete)) {
      showToast({
        variant: "error",
        title: "Kustutamine pole lubatud",
        message: getDeleteBlockedMessage(userToDelete),
      });

      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);

      await deleteManageUser(userToDelete.user_id);

      showToast({
        variant: "success",
        title: "Kasutaja kustutatud",
        message: `Kasutaja ${
          userToDelete.username ?? userToDelete.email
        } kustutati.`,
      });

      setIsDeleteModalOpen(false);
      setUserToDelete(null);

      if (pageUsers.length === 1 && page > 1) {
        setPage(page - 1);
      }

      loadUsers();
    } catch (error) {
      console.error(error);

      showToast({
        variant: "error",
        title: "Kustutamine ebaõnnestus",
        message: getDeleteErrorMessage(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Manage"
        title="Kasutajate haldus"
        description="Siin näed kõiki kasutajaid, nende rolle ja lisatud sisu statistikat."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateUserOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Lisa kasutaja
        </button>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            Statistika
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
            Kasutajate ülevaade
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Siin kuvatakse kasutajate arv rollide järgi.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Kasutajad kokku"
              value={stats.total}
              icon={<Users size={24} />}
            />

            <DashboardStatCard
              label="Tavakasutajad"
              value={stats.regular}
              icon={<UserCheck size={24} />}
            />

            <DashboardStatCard
              label="Toimetajad"
              value={stats.editors}
              icon={<Database size={24} />}
            />

            <DashboardStatCard
              label="Administraatorid"
              value={stats.admins}
              icon={<Crown size={24} />}
            />
          </div>
        )}
      </section>

      <DashboardFiltersPanel
        title="Kasutajate nimekiri"
        description="Filtreeri kasutajaid nime, e-posti või rolli järgi."
        activeFiltersCount={activeFiltersCount}
        isOpen={isFiltersOpen}
        onToggle={() => setIsFiltersOpen((current) => !current)}
        onReset={handleResetFilters}
      >
        <UsersFilters filters={filters} onChange={updateFilter} />
      </DashboardFiltersPanel>

      <div className="flex justify-end">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          <span>
            Leitud kasutajaid:{" "}
            <span className="font-extrabold text-slate-950">
              {pageUsers.length}
            </span>
          </span>

          <span className="text-slate-300">/</span>

          <span>
            Kokku:{" "}
            <span className="font-extrabold text-slate-950">
              {filteredUsers.length}
            </span>
          </span>
        </div>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200"
            />
          ))
        ) : pageUsers.length > 0 ? (
          pageUsers.map((user, index) => (
            <ManageUserCard
              key={user.user_id}
              user={user}
              index={index}
              onEdit={handleOpenUpdateUserModal}
              onDelete={handleOpenDeleteUserModal}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
            <h3 className="text-xl font-bold text-slate-900">
              Kasutajaid ei leitud
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Muuda filtreid või lisa uus kasutaja.
            </p>

            <button
              type="button"
              onClick={() => setIsCreateUserOpen(true)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <UserPlus size={18} />
              Lisa kasutaja
            </button>
          </div>
        )}

        {isEditLoading && (
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            Laadin muutmise vormi...
          </p>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Eelmine
            </button>

            <span className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Järgmine
            </button>
          </div>
        )}
      </section>

      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSuccess={handleUserCreated}
      />

      <UpdateUserModal
        isOpen={isUpdateUserOpen}
        user={userToEdit}
        onClose={handleCloseUpdateUserModal}
        onSuccess={handleUserUpdated}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Kustuta kasutaja"
        message={
          userToDelete
            ? `Kas oled kindel, et soovid kustutada kasutaja ${
                userToDelete.username ?? userToDelete.email
              }?`
            : "Kas oled kindel, et soovid selle kasutaja kustutada?"
        }
        confirmLabel="Kustuta kasutaja"
        isLoading={isDeleting}
        onClose={handleCloseDeleteUserModal}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}

export default ManageUsersPage;