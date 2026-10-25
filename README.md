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

## Getting Started with Docker Desktop

### 1. Prerequisites & Tested Versions
- **Docker Desktop:** v24.0.0 or newer (must be **running**)
- **Docker Engine:** Tested with Linux containers (Docker Desktop's default mode)
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

### 3. Build the Docker Image
```bash
docker build -t isapmd/spark:week6 .
```
The first build downloads the base image and installs dependencies, so it can take a few minutes. Confirm the image exists:
```bash
docker images isapmd/spark
```

### 4. Run the Container
```bash
docker run -d --name spark-container -p 3000:3000 --env-file .env isapmd/spark:week6
```

| Detail | Value |
|--------|-------|
| App URL | http://localhost:3000 |
| Port mapping | 3000 (Host) → 3000 (Container) |
| Container name | `spark-container` |
| Base image | `node:20-alpine` |

### 5. Verify the Application

**5.1. Check that the container is running**
```bash
docker ps
```
`spark-container` should be listed with status `Up ...` and ports `0.0.0.0:3000->3000/tcp`.

**5.2. Check the logs for errors**
```bash
docker logs spark-container
```

**5.3. Verify functionality in the browser**
1. Open http://localhost:3000. You'll be redirected to the login page.
2. Log in using the **Login / Masuk** button.
3. Confirm you reach the Administrator Dashboard and that the **Database System** widget shows an **Active** status.

**5.4. (Optional) Quick database check from the terminal**
```bash
curl http://localhost:3000/api/keep-alive
```
Expected response: `{"status":"active","message":"SPARK Database is awake", ...}`

### 6. Viewing Logs
```bash
# Print all logs
docker logs spark-container

# Follow logs live (Ctrl+C to stop following)
docker logs -f spark-container

# Show only the last 100 lines
docker logs --tail 100 spark-container
```
You can also open **Docker Desktop → Containers → spark-container → Logs**.

### 7. Stopping & Cleaning Up
```bash
# Stop the container
docker stop spark-container

# Start it again later (no rebuild needed)
docker start spark-container

# Remove the container (required before re-running with the same name)
docker rm spark-container

# Remove the image (optional, frees disk space)
docker rmi isapmd/spark:week6
```

**Rebuild after code changes**
```bash
docker stop spark-container
docker rm spark-container
docker build -t isapmd/spark:week6 .
docker run -d --name spark-container -p 3000:3000 --env-file .env isapmd/spark:week6
```

### 8. Troubleshooting
### 8. Troubleshooting

**Docker daemon not reachable** (`Cannot connect to the Docker daemon` / `error during connect`)
- Cause: Docker Desktop isn't running.
- Fix: Start Docker Desktop, wait until it says *Engine running*, then retry.

**Image won't run on Windows** (`no matching manifest`)
- Cause: Docker Desktop is in **Windows containers** mode, but the image is Linux (`node:20-alpine`).
- Fix: Right-click the Docker tray icon and choose **Switch to Linux containers**.

**Port already in use** (`port is already allocated` / `address already in use`)
- Cause: Another app is using port 3000.
- Fix: Stop that app, or use another host port: `-p 3001:3000`, then open http://localhost:3001.

**Container name already in use** (`The container name "/spark-container" is already in use`)
- Cause: An old container with the same name still exists.
- Fix: Run `docker rm -f spark-container`, then run the container again.

**`.env` file not found** (`open .env: no such file or directory`)
- Cause: The file is missing, or you're running the command from the wrong folder.
- Fix: Get the `.env` file from the code owner, put it in the project root, and run the command from that folder.

**Container exits right away** (logs show `Missing Supabase environment variables`)
- Cause: `.env` is empty, misnamed (e.g. `.env.txt`), or missing a variable.
- Fix: Make sure the file is named exactly `.env` and contains all three Supabase variables. Ask the code owner for a fresh copy if needed.

**Login fails or the Database System widget isn't "Active"**
- Cause: Wrong or expired Supabase credentials, or the Supabase project is paused.
- Fix: Ask the code owner to confirm the credentials and that the Supabase project is active, then recreate the container.

**`.env` values seem ignored or broken**
- Cause: `docker --env-file` does not strip quotes, so `KEY="value"` keeps the quotes as part of the value.
- Fix: Use `KEY=value` with no quotes.

**Changed `.env` but nothing changed**
- Cause: Environment variables are read only when the container is created.
- Fix: Run `docker rm -f spark-container`, then run the container again.

**`docker build` fails while installing packages**
- Cause: Network problem or a stale cache.
- Fix: Check your internet connection, then retry with `docker build --no-cache -t isapmd/spark:week6 .`

**Page doesn't load but the container is `Up`**
- Cause: The app is still starting.
- Fix: Wait a few seconds, watch `docker logs -f spark-container`, then refresh the page.

**Need to look inside the container**
- Run `docker exec -it spark-container sh` (type `exit` to leave).

### 9. Tutorial Docker Run Video:
Link: https://drive.google.com/drive/folders/1DiRrfVDaAFAR-B0OLjsdVu35ZMnqKOtf?hl=ID

---

**Built with ☕, caffeine-fueled determination, and a healthy fear of spreadsheets, for SMA Presiden.**

*Stay curious. Stay disciplined. Stay above 60 points.*

