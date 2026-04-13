import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;