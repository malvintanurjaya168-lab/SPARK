## What is this?

SPARK is a discipline-and-achievement tracking system for **SMA Presiden**. Teachers, dormitory supervisors and the student affairs office (*Kesiswaan*) log what students do, good or bad. Every student gets a live **point score** and a status badge.

**The app UI is in Bahasa Indonesia**, because that's who uses it. This README is in English so the rest of the internet can enjoy the jokes too.

---

## The Rules

Everyone starts with **100 points**. After that, it's up to you.
**85+ = Excellent** Teacher's pet. Possibly a saint.
**75 – 84 = Good** Solid citizen. Occasionally late.
**60 – 74 = Warning** Someone has been noticed.
**< 60 = Critical** The badge literally **pulses red**. We're not subtle.

### Sample scoreboard (the defaults from `database-schema.sql`)

**Violations (a.k.a. "the regrets"): where you lose points**
- Late to school - ringan (light)
- Incomplete uniform - ringan (light)
- Skipping class - sedang (medium)
- Smoking on campus - berat (heavy)
- Fighting - berat (heavy)
- Stealing - berat (heavy)

**Rewards (a.k.a. "the redemption arc"): where you gain points**
- Joining an extracurricular
- Keeping the classroom clean
- Helping a friend
- Joining a school competition
- Class champion
- Winning a district/city-level competition

Math check: stealing (−20) costs you ten successful rounds of "Keeping the classroom clean". Choose wisely.

All categories are editable by Kesiswaan in the app, so the numbers above are just the starting lineup.

---

## Meet the Cast (Roles)

SPARK has four roles, and the middleware keeps each one in its own lane. Try to wander into `/kesiswaan` as a student and you'll be bounced back to the login page.

**`siswa`** | Students: They See their own score, history and profile, and window-shop the reward catalog
**`guru`** | Teachers: Access logged journal entries, browse their records, and, if they're a **wali kelas**: check on their homeroom class
**`kesiswaan`** | Student affairs (the final boss): Everything (validate points, manage categories, users, semesters, rankings, reports)
**`admin_pembina_asrama`** | Dormitory supervisors: Access logged dorm incidents, see dorm reports. They know who's up at 2 AM.

---

## Features

- **Dashboards for every role**, with charts (Recharts) breaking things down by location (school / dorm / outside)
- **Point input**: log a violation or reward in a few clicks
- **Validation workflow**: entries can be submitted as *pending* requests, then **approved** or **rejected (with a reason)** by Kesiswaan. Democracy, but with paperwork.
- **Student rankings (*Peringkat*)**: public shaming, but make it a leaderboard
- **Location tracking**: every entry is tagged `sekolah`, `asrama` or `luar`
- **Semesters**: one active semester at a time (the database enforces it, no cheating)
- **Bulk import** of users from Excel, because nobody wants to type 800 students by hand
- **Export to Excel & PDF**: class reports, charts, and individual student reports, ready to hand to a parent who "had no idea"
- **First-login password setup**: accounts are created by the school, and students set their own password the first time they sign in (bcrypt-hashed, JWT session cookie)
- **Interactive particle background**, because a disciplinary system should at least look cool
- **Keep-alive endpoint** (`/api/keep-alive`) that pokes Supabase so the free-tier database doesn't nap. It's the only thing in the school that's never asleep during first period.

---

## Tech Stack
- Framework: **Next.js 16** (App Router) + **React 19** + **TypeScript** 
- Styling: **Tailwind CSS 4**, **shadcn/ui**, Lucide icons, Sonner toasts 
- Database: **Supabase** (PostgreSQL) 
- Auth: `bcryptjs` + `jose` / `jsonwebtoken` session cookie, role-based middleware 
- Charts: **Recharts** 
- Reports: `jspdf`, `jspdf-autotable`, `html2canvas`, `xlsx` 

---

## Getting Started

### 1. Prerequisites & Tested Versions
- **Docker Desktop:** v24.0.0 or newer
- **Docker Engine:** Tested with Linux containers on Docker Desktop
- **Git:** v2.x

### 2. Setup & Configuration

**2.1. Clone the repository**
```bash
git clone https://github.com/malvintanurjaya168-lab/SPARK.git
cd SPARK
git checkout chore/dockerize-project
```

**2.2. Get the environment file**

The app needs a `.env` file with the Supabase credentials. For security reasons it is not stored in the repository, so please **ask the code owner directly for the `.env` file**. Place it in the root directory of the project (the same folder as the `Dockerfile`).

### 3. Build & Run with Docker

**3.1. Build the Docker image**
```bash
docker build -t isapmd/spark:week6 .
```

**3.2. Run the container**
```bash
docker run -d --name spark-container -p 3000:3000 --env-file .env isapmd/spark:week6
```

### 4. Application Details & Access
- **App URL:** http://localhost:3000
- **Host Port Mapping:** 3000 (Host) → 3000 (Container)
- **Base Image:** `node:20-alpine`

### 5. Verification & Health Checks

**5.1. Check container status**
```bash
docker ps
```

**5.2. Verify application functionality**
1. Open http://localhost:3000 in your browser.
2. Go to the login page and click the **Login / Masuk** button.
3. Confirm you reach the Administrator Dashboard and that the **Database System** widget shows an **Active** status.


### 6. Tutorial Docker Run Video:
Link: https://drive.google.com/drive/folders/1DiRrfVDaAFAR-B0OLjsdVu35ZMnqKOtf?hl=ID 

---

**Built with ☕, caffeine-fueled determination, and a healthy fear of spreadsheets, for SMA Presiden.**

*Stay curious. Stay disciplined. Stay above 60 points.*

