# TransitView Backend

Backend rakendus transpordivahendite info ja fotode haldamiseks.  
Põhineb ideel nagu ebus.ee.

## Funktsionaalsus

- JWT autentimine (login)
- rollipõhine autoriseerimine
- transpordikaartide loomine koos fotoga
- fotode lisamine olemasolevale transpordile
- modereerimine (approve / reject)
- Cloudinary piltide salvestus
- reference andmed (cities, models jne)
- kasutajate haldus (admin)
- pagination

## Rollid

- Kasutaja — loob ja haldab enda kirjeid (ainult Ootel / Tagasi_lukatud)
- Andmebaasi_toimetaja — modereerib ja haldab kõiki kirjeid
- Administraator — haldab kasutajaid + kõik õigused

Piirangud:
- admin ei saa luua teist admini
- adminit ei saa kustutada

## Käivitamine

1. install:
npm install

2. prisma:
npm run prisma:migrate
npx prisma generate  
npm run seed

3. run:
npm run dev

Backend:
http://localhost:5000

## .env

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=SCHEMA_NAME"
PORT=5000
JWT_SECRET="key"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

## Auth

Login → tagastab JWT tokeni  
Protected route → Authorization: Bearer TOKEN  

## Peamised endpoints

### Auth

POST /api/auth/login  
→ Login (create session / get JWT token)  
Auth: no  

GET /api/auth/me  
→ Get current user  
Auth: yes  


### Vehicles

GET /api/vehicles  
→ Get all approved vehicles (list, pagination, filters)  
Auth: no  

GET /api/vehicles/:id  
→ Get single vehicle (detail)  
Auth: no  

POST /api/vehicles  
→ Create vehicle with first photo  
Auth: yes  

PATCH /api/vehicles/:id  
→ Update vehicle  
Auth: yes (owner or moderator/admin)  

DELETE /api/vehicles/:id  
→ Delete vehicle  
Auth: yes (owner or moderator/admin)  

GET /api/vehicles/pending  
→ Get vehicles for moderation  
Auth: yes (moderator/admin)  

PATCH /api/vehicles/:id/approve  
→ Approve vehicle (+ first photo)  
Auth: yes (moderator/admin)  

PATCH /api/vehicles/:id/reject  
→ Reject vehicle (+ first photo)  
Auth: yes (moderator/admin)  


### Photos

POST /api/photos/upload  
→ Upload image to Cloudinary  
Auth: yes  

GET /api/photos  
→ Get all approved photos (list, pagination)  
Auth: no  

GET /api/photos/:id  
→ Get single photo  
Auth: no  

GET /api/photos/vehicle/:vehicleId  
→ Get photos for specific vehicle  
Auth: no  

POST /api/photos  
→ Create photo (attach to vehicle)  
Auth: yes  

PATCH /api/photos/:id  
→ Update photo metadata  
Auth: yes (owner or moderator/admin)  

DELETE /api/photos/:id  
→ Delete photo  
Auth: yes (owner or moderator/admin)  

GET /api/photos/pending  
→ Get photos for moderation  
Auth: yes (moderator/admin)  

PATCH /api/photos/:id/approve  
→ Approve photo  
Auth: yes (moderator/admin)  

PATCH /api/photos/:id/reject  
→ Reject photo  
Auth: yes (moderator/admin)  


### Reference (no auth)

GET /api/reference/counties  
→ Get all counties  

GET /api/reference/cities  
→ Get cities (optionally by countyId)  

GET /api/reference/categories  
→ Get vehicle categories  

GET /api/reference/models  
→ Get models (optionally by categoryId)  

GET /api/reference/companies  
→ Get companies  

GET /api/reference/company-branches  
→ Get company branches (filter by companyId / cityId)  


### Users (admin only)

GET /api/users  
→ Get all users  
Auth: admin  

GET /api/users/:id  
→ Get single user  
Auth: admin  

POST /api/users  
→ Create user  
Auth: admin  

PATCH /api/users/:id  
→ Update user (username / password / role)  
Auth: admin  

DELETE /api/users/:id  
→ Delete user  
Auth: admin  

## Modereerimine

Transport luuakse staatuses Ootel.  
Approve → muutub Kinnitatud + esimene foto samuti.  
Reject → Tagasi_lukatud + esimene foto samuti.  

Fotod modereeritakse eraldi.

## Zod

Kasutatakse olulistes kohtades:
- login  
- create/update vehicle  
- create/update photo  
- create/update user  

## Notes

Backend toetab:
- auth + roles  
- vehicles + photos  
- moderation  
- cloudinary  
- reference data  
- admin user management  
