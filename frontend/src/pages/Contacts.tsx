// This page shows the contact form and team contact cards.
// It validates the form, sends messages to the backend, and gives the user toast feedback.
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Info,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  UserCog,
  UserPlus,
} from "lucide-react";

import PageHero from "../components/ui/PageHero";
import RequiredLabel from "../components/ui/RequiredLabel";
import { TEAM_DATA } from "../data/teamData";
import { useToast } from "../hooks/useToast";
import { sendContactMessage } from "../config/contactApi";
import { reportError } from "../utils/logger";

type ContactType = "account" | "question" | "bug" | "suggestion";

const MIN_CONTACT_MESSAGE_LENGTH = 10;

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

function getContactValidationMessage(error: unknown) {
  const data = (error as {
    response?: {
      data?: {
        errors?: {
          message?: string[];
        };
      };
    };
  }).response?.data;

  if (data?.errors?.message?.includes("message is too short")) {
    return "Kirjuta sõnumisse vähemalt 10 tähemärki.";
  }

  return null;
}

function Contacts() {
  const { showToast } = useToast();

  const [contactType, setContactType] = useState<ContactType>("question");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAccountRequest = contactType === "account";

  const formTitle = isAccountRequest
    ? "Soovin kasutajakontot"
    : "Saada meile teade";

  const formDescription = isAccountRequest
    ? "Pärast taotluse saatmist vaatab administraator andmed üle ja loob vajadusel konto rolliga Kasutaja."
    : "Kirjutage oma küsimus, probleem või ettepanek. Vastame esimesel võimalusel.";

  const messagePlaceholder = isAccountRequest
    ? "Kirjeldage lühidalt, miks soovite TransitView kasutajaks saada..."
    : "Kirjeldage oma küsimust, probleemi või ettepanekut võimalikult selgelt...";

  function handleContactTypeChange(value: ContactType) {
    setContactType(value);
    setTopic("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < MIN_CONTACT_MESSAGE_LENGTH) {
      showToast({
        variant: "error",
        title: "Sõnum on liiga lühike",
        message: "Kirjuta sõnumisse vähemalt 10 tähemärki.",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      await sendContactMessage({
        contactType,
        fullName: fullName.trim(),
        email: email.trim(),
        topic: topic.trim(),
        message: trimmedMessage,
      });

      showToast({
        variant: "success",
        title: isAccountRequest ? "Taotlus saadetud" : "Teade saadetud",
        message: isAccountRequest
          ? "Võtame teiega ühendust pärast andmete kontrollimist."
          : "Aitäh! Võtame teiega ühendust esimesel võimalusel.",
      });

      setContactType("question");
      setFullName("");
      setEmail("");
      setTopic("");
      setMessage("");
    } catch (error) {
      reportError(error);

      const validationMessage = getContactValidationMessage(error);

      showToast({
        variant: "error",
        title: validationMessage
          ? "Sõnum on liiga lühike"
          : "Saatmine ebaõnnestus",
        message:
          validationMessage ??
          "Teadet ei õnnestunud saata. Proovige hiljem uuesti või kirjutage otse e-postile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Kontaktid"
        title="Võta meiega ühendust"
        description="Selle vormi kaudu saab esitada küsimusi, teatada probleemidest, teha ettepanekuid või taotleda tavalist TransitView kasutajakontot."
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
              Kui teil on küsimusi konto loomise, andmete parandamise,
              modereerimise või portaali kasutamise kohta, saate ühendust võtta
              meie meeskonnaga.
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
                  Selle vormi kaudu saab taotleda ainult tavalist kasutajakontot
                  rolliga <span className="font-bold">Kasutaja</span>.
                  Andmebaasi toimetaja või administraatori õigusi selle vormi
                  kaudu taotleda ei saa.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            <span className="font-bold">NB!</span> Ärge saatke vormi kaudu
            paroole ega tundlikke isikuandmeid. Vastame tavaliselt 3 päeva
            jooksul.
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[30px] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 lg:p-7"
          lang="et-EE"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {isAccountRequest ? (
                <UserPlus className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                Kontaktivorm
              </p>

              <h2 className="text-2xl font-bold text-slate-900">
                {formTitle}
              </h2>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
            {formDescription}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Tärniga <span className="font-bold text-red-500">*</span> märgitud
            väljad on kohustuslikud.
          </p>

          <div className="mt-7">
            <RequiredLabel required>Päringu tüüp</RequiredLabel>

            <select
              name="contactType"
              value={contactType}
              onChange={(event) =>
                handleContactTypeChange(event.target.value as ContactType)
              }
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            >
              <option value="question">Küsimus</option>
              <option value="account">Kasutajakonto taotlus</option>
              <option value="bug">Veateade</option>
              <option value="suggestion">Ettepanek</option>
            </select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <RequiredLabel required>Täisnimi</RequiredLabel>

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
              <RequiredLabel required>E-posti aadress</RequiredLabel>

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

          {isAccountRequest && (
            <div className="mt-4">
              <RequiredLabel>Soovitud roll</RequiredLabel>

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
          )}

          <div className="mt-4">
            <RequiredLabel required>
              {isAccountRequest ? "Miks soovite kontot?" : "Teema"}
            </RequiredLabel>

            <select
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            >
              <option value="">
                {isAccountRequest ? "Vali põhjus" : "Vali teema"}
              </option>

              {isAccountRequest ? (
                <>
                  <option value="Soovin lisada transpordikaarte">
                    Soovin lisada transpordikaarte
                  </option>
                  <option value="Soovin lisada fotosid">
                    Soovin lisada fotosid
                  </option>
                  <option value="Soovin täiendada andmebaasi">
                    Soovin täiendada andmebaasi
                  </option>
                  <option value="Muu põhjus">Muu põhjus</option>
                </>
              ) : (
                <>
                  <option value="Konto loomine">Konto loomine</option>
                  <option value="Andmete parandamine">
                    Andmete parandamine
                  </option>
                  <option value="Foto või sõiduki info">
                    Foto või sõiduki info
                  </option>
                  <option value="Tehniline probleem">
                    Tehniline probleem
                  </option>
                  <option value="Üldine küsimus">Üldine küsimus</option>
                  <option value="Muu teema">Muu teema</option>
                </>
              )}
            </select>
          </div>

          <div className="mt-4">
            <RequiredLabel required>
              {isAccountRequest ? "Lisainfo" : "Sõnum"}
            </RequiredLabel>

            <textarea
              name="message"
              rows={7}
              minLength={MIN_CONTACT_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={messagePlaceholder}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            <Send className="h-5 w-5" />
            {isSubmitting
              ? "Saadan..."
              : isAccountRequest
                ? "Saada konto taotlus"
                : "Saada teade"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Contacts;
