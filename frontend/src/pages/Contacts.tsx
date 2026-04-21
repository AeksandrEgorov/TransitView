import React from 'react';
import { Mail, ShieldCheck, UserCog, Send } from "lucide-react";
import { TEAM_DATA } from "../data/teamData";

const iconMap = {
  admin: <ShieldCheck className="w-5 h-5 text-blue-600" />,
  moderator: <UserCog className="w-5 h-5 text-amber-600" />,
};
const Administration: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Teade on saadetud!"); 
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Kontakt</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Kontaktid
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 leading-relaxed">
          Kui teil on küsimusi veebisaidi töö kohta, ettepanekuid arenduseks või soovite teatada veast, 
          võite kasutada allolevat vormi või võtta ühendust otse administratsiooniga.
        </p>
      </section>
      <div className="grid gap-12 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Saada meile teade
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Teie nimi</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" 
                  placeholder="Jaan Tamm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">E-posti aadress</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" 
                  placeholder="jaan@example.ee" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Teema</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" 
                placeholder="Millest soovite rääkida?" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Sõnum</label>
              <textarea 
                rows={5} 
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400" 
                placeholder="Kirjuta oma küsimus siia..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-blue-500/25 w-full sm:w-auto"
            >
              <Send className="w-5 h-5" />
              Saada sõnum
            </button>
          </form>
        </div>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2 px-1">Meie meeskond</h2>
          {TEAM_DATA.map((member) => (
            <div 
              key={member.id} 
              className="group bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-slate-100">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {iconMap[member.variant]}
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {member.role}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{member.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {member.description}
                </p>
                <a 
                  href={`mailto:${member.email}`} 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                >
                  <Mail className="w-4 h-4" />
                  {member.email}
                </a>
              </div>
            </div>
          ))}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100/50">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold uppercase mr-1">NB!</span> 
              Vastame tavaliselt 24-48 tunni jooksul. Kiirete küsimuste korral kontrollige esmalt portaali reegleid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Administration;