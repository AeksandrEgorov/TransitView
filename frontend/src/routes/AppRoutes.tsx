// This file is the main route map for the React app.
// It connects public pages, dashboard pages, lazy loading, and protected role checks.

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const MainLayout = lazy(() => import("../layouts/MainLayout"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));

const HomePage = lazy(() => import("../pages/HomePage"));
const GalleryPage = lazy(() => import("../pages/GalleryPage"));
const GalleryRules = lazy(() => import("../pages/GalleryRules"));
const Contacts = lazy(() => import("../pages/Contacts"));
const VehicleDetailPage = lazy(() => import("../pages/VehicleDetailPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const DashboardHomePage = lazy(
  () => import("../pages/dashboard/DashboardHomePage")
);
const MyVehiclesPage = lazy(
  () => import("../pages/dashboard/MyVehiclesPage")
);
const MyVehicleDetailPage = lazy(
  () => import("../pages/dashboard/MyVehicleDetailPage")
);
const MyPhotosPage = lazy(() => import("../pages/dashboard/MyPhotosPage"));
const ManageVehiclesPage = lazy(
  () => import("../pages/dashboard/manage/ManageVehiclesPage")
);
const ManageVehicleDetailPage = lazy(
  () => import("../pages/dashboard/manage/ManageVehicleDetailPage")
);
const ManagePhotosPage = lazy(
  () => import("../pages/dashboard/manage/ManagePhotosPage")
);
const ManageUsersPage = lazy(
  () => import("../pages/dashboard/manage/ManageUsersPage")
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-sm font-semibold text-slate-500">
      Laadin...
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/rules" element={<GalleryRules />} />
          <Route path="/contacts" element={<Contacts />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="vehicles" element={<MyVehiclesPage />} />
            <Route
              path="vehicles/:vehicleId"
              element={<MyVehicleDetailPage />}
            />
            <Route path="photos" element={<MyPhotosPage />} />

            <Route
              element={
                <RoleRoute roles={["Andmebaasi_toimetaja", "Administraator"]} />
              }
            >
              <Route path="manage/vehicles" element={<ManageVehiclesPage />} />
              <Route
                path="manage/vehicles/:vehicleId"
                element={<ManageVehicleDetailPage />}
              />
              <Route path="manage/photos" element={<ManagePhotosPage />} />
            </Route>

            <Route element={<RoleRoute roles={["Administraator"]} />}>
              <Route path="manage/users" element={<ManageUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
