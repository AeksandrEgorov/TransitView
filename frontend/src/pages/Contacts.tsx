import { useState } from "react";
import type { FormEvent } from "react";
import {
  Mail,
  Send,
  ShieldCheck,
  UserCog,
  UserPlus,
  Info,
} from "lucide-react";
import PageHero from "../components/ui/PageHero";
import { TEAM_DATA } from "../data/teamData";
import { useToast } from "../hooks/useToast";

const iconMap = {
  admin: <ShieldCheck className="h-4 w-4" />,
  moderator: <UserCog className="h-4 w-4" />,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Contacts() {
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestData = {
      fullName,
      email,
      requestedRole: "Kasutaja",
      reason,
      message,
    };

    console.log("Account request data:", requestData);

    showToast({
      variant: "success",
      title: "Taotlus saadetud",
      message: "Võtame teiega ühendust pärast andmete kontrollimist.",
    });

    setFullName("");
    setEmail("");
    setReason("");
    setMessage("");
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Kontaktid"
        title="Kasutajakonto taotlus"
        description="TransitView ei kasuta avalikku registreerimist. Kui soovite süsteemi kasutajaks saada, saatke meile taotlus. Pärast andmete kontrollimist saab administraator konto luua."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Meeskond
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Projekti haldajad
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kui teil on küsimusi konto loomise, andmete parandamise või
              portaali kasutamise kohta, saate ühendust võtta meie meeskonnaga.
            </p>

            <div className="mt-6 space-y-4">
              {TEAM_DATA.map((member) => (
                <article
                  key={member.id}
                  className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#101a2d] text-lg font-extrabold text-white shadow-sm">
                      {getInitials(member.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-blue-600">
                        {iconMap[member.variant]}
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">
                          {member.role}
                        </p>
                      </div>

                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        {member.name}
                      </h3>

                      <a
                        href={`mailto:${member.email}`}
                        className="mt-2 inline-flex items-center gap-2 break-all text-sm font-medium text-slate-600 transition hover:text-slate-900"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        {member.email}
                      </a>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {member.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-900">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Konto loomine toimub käsitsi.</p>
                <p className="mt-1">
                  Taotluse kaudu saab küsida ainult tavalist kasutajakontot.
                  Andmebaasi toimetaja või administraatori õigusi selle vormi
                  kaudu taotleda ei saa.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            <span className="font-bold">NB!</span> Ärge saatke vormi kaudu
            paroole ega tundlikke isikuandmeid. Vastame tavaliselt 24–48 tunni
            jooksul.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 lg:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                Taotlus
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Soovin kasutajakontot
              </h2>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
            Pärast taotluse saatmist vaatab administraator andmed üle ja loob
            vajadusel konto rolliga{" "}
            <span className="font-bold text-slate-900">Kasutaja</span>.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Täisnimi
              </label>

              <input
                type="text"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jaan Tamm"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                E-posti aadress
              </label>

              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jaan@example.ee"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Soovitud roll
            </label>

            <input
              type="text"
              name="requestedRole"
              value="Kasutaja"
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Selle vormi kaudu saab taotleda ainult tavalist kasutajakontot.
            </p>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Miks soovite kontot?
            </label>

            <select
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            >
              <option value="">Vali põhjus</option>
              <option value="Soovin lisada transpordikaarte">
                Soovin lisada transpordikaarte
              </option>
              <option value="Soovin lisada fotosid">
                Soovin lisada fotosid
              </option>
              <option value="Muu põhjus">Muu põhjus</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Lisainfo
            </label>

            <textarea
              name="message"
              rows={7}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Kirjeldage lühidalt, miks soovite TransitView kasutajaks saada..."
              className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)] transition hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
            Saada konto taotlus
          </button>
        </form>
      </section>
    </div>
  );
}

export default Contacts;