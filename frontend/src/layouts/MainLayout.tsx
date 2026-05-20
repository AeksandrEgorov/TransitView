// This layout is used by the public side of the site.
// It keeps the shared header, footer, and page container around public routes.

import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#101a2d] text-slate-900">
      <div className="flex-1">
        <Header />

        <section className="w-full px-3 pt-6 pb-10 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1700px] overflow-hidden rounded-[28px] bg-slate-50 shadow-[0_18px_60px_rgba(2,6,23,0.22)] ring-1 ring-white/70">
            <main
              key={location.pathname}
              className="p-4 sm:p-6 lg:p-8 xl:p-10 animate-page-in"
            >
              <Outlet />
            </main>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default MainLayout;
