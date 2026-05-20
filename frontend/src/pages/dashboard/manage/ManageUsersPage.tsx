// This page is where admins and editors inspect users.
// Admins can create, edit, and delete users while protected accounts stay locked down.

import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Database,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import DashboardPageHeader from "../../../components/dashboard/DashboardPageHeader";
import DashboardStatCard from "../../../components/dashboard/DashboardStatCard";
import DashboardFiltersPanel from "../../../components/dashboard/DashboardFiltersPanel";
import ManageUserCard, {
  type ManageUserCardData,
} from "../../../components/dashboard/manage-users/ManageUserCard";
import ManageUsersFilters, {
  type ManageUserFilterState,
} from "../../../components/dashboard/manage-users/ManageUsersFilters";
import CreateUserModal from "../../../components/modals/users/CreateUserModal";
import UpdateUserModal from "../../../components/modals/users/UpdateUserModal";
import DeleteConfirmModal from "../../../components/modals/confirm/DeleteConfirmModal";

import {
  deleteManageUser,
  getManageUserById,
  getManageUsers,
} from "../../../config/manageApi";

import { useToast } from "../../../hooks/useToast";
import { reportError } from "../../../utils/logger";

type ManageUser = ManageUserCardData;

const initialFilters: ManageUserFilterState = {
  search: "",
  role: "",
};

const FILTER_DEBOUNCE_MS = 400;
const limit = 10;

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

function ManageUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<ManageUser[]>([]);
  const [filters, setFilters] =
    useState<ManageUserFilterState>(initialFilters);
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
      reportError(error);

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

  function updateFilter<K extends keyof ManageUserFilterState>(
    key: K,
    value: ManageUserFilterState[K]
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
      reportError(error);

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
      reportError(error);

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
        <ManageUsersFilters filters={filters} onChange={updateFilter} />
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
