import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <div className="flex-1 bg-[#172338]">
        <Header />

        <section className="w-full px-3 pt-6 pb-10 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1700px] rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
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