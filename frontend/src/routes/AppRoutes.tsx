import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import GalleryPage from "../pages/GalleryPage";
import DashboardPage from "../pages/DashboardPage";
import GalleryRules from "../pages/GalleryRules";
import Administration from "../pages/Contacts";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/rules" element={<GalleryRules />} />
        <Route path="/contacts" element={<Administration />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;