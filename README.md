# TransitView

TransitView on täisstack veebirakendus ühistranspordi sõidukite andmete ja fotode kogumiseks, vaatamiseks ning modereerimiseks.

Projekt on jagatud kaheks osaks:

- `backend` - Express, Prisma, PostgreSQL, JWT autentimine, Cloudinary pildilaadimised ja Resend kontaktivormi e-post.
- `frontend` - React, Vite, Tailwind CSS ja React Router.

## Projekti Struktuur

```text
TransitView/
|-- backend/
|   |-- prisma/
|   |   |-- data/              # Seed-andmed, mida kasutab backend/prisma/seed.ts
|   |   |-- migrations/        # Prisma migratsioonid
|   |   |-- schema.prisma      # Andmebaasi skeem
|   |   `-- seed.ts            # Loob demoandmed ja andmebaasi vaated
|   |-- src/
|   |   |-- app.ts             # Expressi rakenduse sisenemispunkt
|   |   |-- config/            # Prisma, Multer ja Cloudinary seadistus
|   |   |-- controllers/       # HTTP päringute käsitlejad
|   |   |-- middleware/        # Autentimise ja rollide kontroll
|   |   |-- routes/            # API marsruudid
|   |   |-- services/          # Andmebaasi- ja äriloogika
|   |   |-- types/             # Backendi TypeScript tüübid
|   |   |-- utils/             # Backendi ühised abifunktsioonid
|   |   |-- validators/        # Zod päringuvalidaatorid
|   |   `-- generated/         # Genereeritud Prisma klient, ära muuda käsitsi
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- assets/            # Globaalne CSS ja staatilised failid
|   |   |-- components/        # Taaskasutatavad UI osad, kaardid, filtrid ja modaalid
|   |   |-- config/            # Frontendi API kliendid
|   |   |-- context/           # Authi ja toastide providerid
|   |   |-- data/              # Staatilised leheandmed
|   |   |-- hooks/             # Taaskasutatavad React hookid
|   |   |-- layouts/           # Avalik ja dashboard layout
|   |   |-- pages/             # Route lehed
|   |   |-- routes/            # React Router seadistus ja route guardid
|   |   |-- types/             # Frontendi TypeScript tüübid
|   |   `-- utils/             # Frontendi ühised abifunktsioonid
|   |-- vercel.json            # Frontendi Vercel seadistus
|   `-- package.json
|-- .env.example.backend       # Backendi env näidis
|-- .env.example.frontend      # Frontendi env näidis
`-- README.md
```

Üldine reegel on lihtne: `controllers` tegelevad HTTP detailidega, `services` sisaldavad andmebaasi- ja äriloogikat ning frontendi `pages` panevad API päringud kokku taaskasutatavate `components` komponentidega.

## Funktsioonid

- Avalik sõidukite ja fotode sirvimine filtrite ning lehekülgedega.
- Sisselogitud kasutaja dashboard oma sõidukite ja fotode haldamiseks.
- Modereerimise dashboard toimetajatele ja administraatoritele.
- Sõiduki loomine koos esimese foto üleslaadimisega.
- Fotode lisamine olemasolevatele sõidukitele.
- Ülevaatuse staatused: `Ootel`, `Kinnitatud`, `Tagasi_lukatud`.
- Sõiduki seisundid: `Töökorras`, `Ei_tööta`, `Maha_kantud`, `Müüdud`, `Teadmata`.
- Piltide hoidmine Cloudinarys.
- Kontaktivormi e-kirjad Resendi kaudu.
- Rollipõhine ligipääsukontroll.

## Rollid

- `Kasutaja` - haldab enda ootel või tagasi lükatud sõidukeid ja fotosid.
- `Andmebaasi_toimetaja` - modereerib ja haldab kogu sisu.
- `Administraator` - haldab kasutajaid ning tal on kõik toimetaja õigused.

Administraatori piirangud:

- Administraatorit ei saa tavapärase kasutaja loomise vormi kaudu luua.
- Administraatori kasutajat ei saa kustutada.
- Kui kasutajaga on seotud sõidukeid või fotosid, tuleb need enne kasutaja kustutamist eemaldada.

## Nõuded

- Node.js
- npm
- PostgreSQL
- Cloudinary konto
- Resend konto kontaktivormi e-kirjade jaoks

## Backendi Seadistus

Mine `backend` kausta:

```bash
npm install
```

Loo fail `backend/.env`, kasutades näidisena `.env.example.backend`, ja täida väärtused:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=SCHEMA_NAME"
PORT=5000
JWT_SECRET="change-this-secret"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

RESEND_API_KEY=""
CONTACT_FROM_EMAIL="TransitView <onboarding@resend.dev>"
CONTACT_TO_EMAIL="youremail@example.com"

SEED_USER_PASSWORD="change-this-user-password"
SEED_EDITOR_PASSWORD="change-this-editor-password"
SEED_ADMIN_PASSWORD="change-this-admin-password"
```

Märkused:

- Ära commiti päris `.env` faile. Need on Gitist välja jäetud.
- `CONTACT_TO_EMAIL` võib sisaldada mitut saajat, eralda aadressid komadega.
- `CONTACT_FROM_EMAIL` peab olema saatja, mida Resend lubab kasutada. Testimiseks sobib `onboarding@resend.dev`. Productionis verifitseeri Resendis oma domeen ja kasuta näiteks `TransitView <noreply@sinudomeen.ee>`.
- Seed kasutajate paroolid on env muutujates, mitte failis `backend/prisma/data/users.ts`.

Genereeri Prisma klient:

```bash
npm run prisma:generate
```

Käivita migratsioonid:

```bash
npm run prisma:migrate
```

Loo või lähtesta andmebaas koos seed-andmetega:

```bash
npm run db:setup
```

Käivita backend arenduses:

```bash
npm run dev
```

Buildi backend:

```bash
npm run build
```

Käivita builditud backend:

```bash
npm run start
```

Vaikimisi lokaalne API aadress:

```text
http://localhost:5000/api
```

## Frontendi Seadistus

Mine `frontend` kausta:

```bash
npm install
```

Loo fail `frontend/.env`, kasutades näidisena `.env.example.frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Käivita frontend arenduses:

```bash
npm run dev
```

Buildi frontend:

```bash
npm run build
```

Kontrolli frontendi lintimist:

```bash
npm run lint
```

Vaata production buildi lokaalselt:

```bash
npm run preview
```

## Deployment

Avalikku deploy versiooni saab vaadata siin:

```text
https://transitview.vercel.app/
```

Esimene avamine võib võtta umbes minuti, sest backend kasutab tasuta plaani ja võib vahepeal magama minna.

### Frontend Vercelis

Frontendi kaustas on `frontend/vercel.json`, mis teeb Vercelis SPA route'id korda ja suunab otse avatud lehed tagasi `index.html` peale.

Kui Verceli projekti root on `frontend`, kasuta:

- install command: `npm ci`
- build command: `npm run build`
- output directory: `dist`

Kui Verceli projekti root on repo juur, kasuta:

- install command: `cd frontend && npm ci`
- build command: `cd frontend && npm run build`
- output directory: `frontend/dist`

Lisa Vercelisse see environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

### Backendi Majutus

Backend on pikalt töötav Express server. Seda tasub majutada Node'i toetavas keskkonnas, näiteks Render, Railway, Fly.io, VPS või mõni muu teenus, mis lubab PostgreSQL ühendust ja püsivaid env muutujaid.

Lisa samad backendi env muutujad, mis on kirjas backendi seadistuse osas.

## Kontaktivormi E-post

Frontend saadab kontaktivormi päringud siia:

```text
POST /api/contact
```

Backend valideerib andmed Zodiga ja saadab kirja Resendi kaudu.

Vajalikud backendi env muutujad:

```env
RESEND_API_KEY=""
CONTACT_FROM_EMAIL="TransitView <onboarding@resend.dev>"
CONTACT_TO_EMAIL="youremail@example.com"
```

Kasutaja sisestatud e-post läheb kirja `reply_to` väljale, nii et administraator saab vastata otse vormi saatjale.

## Autentimine

Login tagastab JWT tokeni. Kaitstud päringud kasutavad päist:

```text
Authorization: Bearer TOKEN
```

## Peamised API Endpointid

### Auth

```text
POST /api/auth/login
GET  /api/auth/me
```

### Avalikud Sõidukid

```text
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/pending
```

Sõiduki loomine, muutmine ja kustutamine nõuab sisselogimist. Ootel sõidukite vaade nõuab toimetaja või administraatori rolli.

### Avalikud Fotod

```text
POST   /api/photos/upload
GET    /api/photos
GET    /api/photos/:id
GET    /api/photos/vehicle/:vehicleId
POST   /api/photos
PATCH  /api/photos/:id
DELETE /api/photos/:id
GET    /api/photos/pending
```

Foto loomine, muutmine ja kustutamine nõuab sisselogimist. Ootel fotode vaade nõuab toimetaja või administraatori rolli.

### Sõidukite Haldus

Ainult toimetajale ja administraatorile:

```text
GET    /api/manage/vehicles
GET    /api/manage/vehicles/:id
PATCH  /api/manage/vehicles/:id
DELETE /api/manage/vehicles/:id
PATCH  /api/manage/vehicles/:id/approve
PATCH  /api/manage/vehicles/:id/reject
PATCH  /api/manage/vehicles/:id/pending
```

### Fotode Haldus

Ainult toimetajale ja administraatorile:

```text
GET    /api/manage/photos
GET    /api/manage/photos/:id
PATCH  /api/manage/photos/:id
DELETE /api/manage/photos/:id
PATCH  /api/manage/photos/:id/approve
PATCH  /api/manage/photos/:id/reject
PATCH  /api/manage/photos/:id/pending
```

### Kasutajate Haldus

Toimetaja ja administraator saavad kasutajaid vaadata. Administraatori-only tegevused on piiratud route'ides ja controllerites.

```text
GET    /api/manage/users
GET    /api/manage/users/:id
POST   /api/manage/users
PATCH  /api/manage/users/:id
DELETE /api/manage/users/:id
```

### Reference Andmed

```text
GET /api/reference/public-filters
GET /api/reference/my-filters
GET /api/reference/manage-filters
GET /api/reference/counties
GET /api/reference/cities
GET /api/reference/categories
GET /api/reference/models
GET /api/reference/companies
GET /api/reference/company-branches
```

`my-filters` nõuab sisselogimist. `manage-filters` nõuab toimetaja või administraatori rolli ning sisaldab haldusele nähtavaid andmeid, ka uusi ja üle vaatamata kirjeid.

### Statistika

```text
GET /api/stats/public
GET /api/stats/my
GET /api/stats/manage
```

`my` nõuab sisselogimist. `manage` nõuab toimetaja või administraatori rolli.

### Kontakt

```text
POST /api/contact
```

Avalik endpoint kontaktivormi jaoks.

## Modereerimise Reeglid

- Uued sõidukid ja fotod luuakse staatusega `Ootel`.
- Kinnitatud kirjed saavad staatuse `Kinnitatud`.
- Tagasi lükatud kirjed saavad staatuse `Tagasi_lukatud` ja vajavad kommentaari.
- Sõiduki kinnitamine või tagasilükkamine uuendab vajadusel seotud ootel reference-andmeid.
- Kui kinnitatud sõiduk viiakse tagasi `Ootel` staatusesse, viiakse ka ainult selle sõidukiga seotud reference-andmed tagasi `Ootel` staatusesse.
- Halduse lehed näevad kõiki staatusi. Avalikud lehed näitavad ainult kinnitatud avalikke andmeid.

## Kasulikud Käsud

Backend:

```bash
cd backend
npm run prisma:generate
npm run build
npm run dev
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run dev
```

## Turvalisuse Märkused

- Ära commiti päris API võtmeid, JWT secreteid, andmebaasi URL-e ega seed paroole.
- Kui mõni API võti on väljaspool kohalikku `.env` faili jagatud, roteeri see.
- `VITE_API_BASE_URL` peab olema avalikuks kasutuseks sobiv, sest frontendi env muutujad lähevad kliendikoodi sisse.
- Resendi ja Cloudinary salajased võtmed, JWT secret ja andmebaasi andmed peavad jääma ainult backendi env muutujatesse.
