import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import GalleryPage from "../pages/GalleryPage";
import DashboardPage from "../pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import GalleryRules from "../pages/GalleryRules";
import ContactsPage from "../pages/Contacts";
import NotFoundPage from "../pages/NotFoundPage";
import VehicleDetailPage from "../pages/VehicleDetailPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/rules" element={<GalleryRules />} />
        <Route path="/contacts" element={<ContactsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;