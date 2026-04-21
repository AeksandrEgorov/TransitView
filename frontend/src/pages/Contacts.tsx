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
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Kontakt</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Kontaktid
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-slate-600 leading-relaxed">
          Kui teil on küsimusi veebisaidi töö kohta, ettepanekuid arenduseks või soovite teatada veast, 
          võite kasutada allolevat vormi või võtta ühendust otse administratsiooniga.
        </p>
      </section>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center justify-center gap-2">
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
            className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-blue-500/25 w-full"
          >
            <Send className="w-5 h-5" />
            Saada sõnum
          </button>
        </form>
      </div>
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 text-center">Meie meeskond</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
          {TEAM_DATA.map((member) => (
            <div 
              key={member.id} 
              className="group bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col md:flex-row"
            >
              <div className="md:w-1/3 aspect-square overflow-hidden bg-slate-100">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 md:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  {iconMap[member.variant]}
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {member.role}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{member.name}</h3>
                <a 
                  href={`mailto:${member.email}`} 
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {member.email}
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-amber-50 border border-amber-100/50">
          <p className="text-xs text-amber-800 text-center leading-relaxed">
            <span className="font-bold uppercase mr-1">NB!</span> 
            Vastame tavaliselt 24-48 tunni jooksul. Kiirete küsimuste korral kontrollige esmalt portaali reegleid.
          </p>
        </div>
      </section>
    </div>
  );
};
export default Administration;