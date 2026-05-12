import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import HomePage from "../pages/HomePage";
import GalleryPage from "../pages/GalleryPage";
import GalleryRules from "../pages/GalleryRules";
import Contacts from "../pages/Contacts";
import VehicleDetailPage from "../pages/VehicleDetailPage";
import NotFoundPage from "../pages/NotFoundPage";

import DashboardHomePage from "../pages/dashboard/DashboardHomePage";
import MyVehiclesPage from "../pages/dashboard/MyVehiclesPage";
import MyVehicleDetailPage from "../pages/dashboard/MyVehicleDetailPage";
import MyPhotosPage from "../pages/dashboard/MyPhotosPage";
import ManageVehiclesPage from "../pages/dashboard/manage/ManageVehiclesPage";
import ManagePhotosPage from "../pages/dashboard/manage/ManagePhotosPage";
import ManageUsersPage from "../pages/dashboard/manage/ManageUsersPage";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
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
          <Route path="vehicles/:vehicleId" element={<MyVehicleDetailPage />} />
          <Route path="photos" element={<MyPhotosPage />} />

          <Route
            element={
              <RoleRoute roles={["Andmebaasi_toimetaja", "Administraator"]} />
            }
          >
            <Route path="manage/vehicles" element={<ManageVehiclesPage />} />
            <Route path="manage/photos" element={<ManagePhotosPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Administraator"]} />}>
            <Route path="manage/users" element={<ManageUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;