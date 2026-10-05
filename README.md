# EcoRoute
A web-application to track the CO2 emmissions of the user as per the distance and the vehicle they are using. It uses real-time data from MapTiler (geocoding) + OSRM (routing), climatiq-api, and OpenAI api to calculate the accurate CO2 emissions and saves it into the user proifile and displays it.

## Project structure

| Folder | What it is |
| --- | --- |
| `demo/` | Spring Boot 3 backend (Java 17, Maven) – REST API on port `8080` |
| `ecoroute-frontend/` | React + Vite frontend – dev server on port `5173` |
| `supabase_migration/` | SQL to create the database schema in Supabase (PostgreSQL) |
| `docker-compose.yml` | Runs the whole stack in Docker |

## Local setup

### 1. Install the prerequisites

- [Java 17+](https://adoptium.net/) (`java -version` to check)
- [Node.js 20+](https://nodejs.org/) (`node -v` to check)
- [Git](https://git-scm.com/)

Maven is **not** needed – the project ships with the Maven wrapper (`mvnw`).

### 2. Get the API keys and a database

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` | Create a free project at [supabase.com](https://supabase.com) → **Project Settings → Database → Connection string → Session pooler**. Use the pooler host, not the direct `db.<ref>.supabase.co` host (that one is IPv6-only). |
| `MAPTILER_API_KEY` | [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/) (free tier) |
| `CLIMATIQ_API_KEY` | [climatiq.io](https://www.climatiq.io/) (free tier) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |

Database tables are created automatically on first start (`ddl-auto=update`). To start from the full schema instead, paste `supabase_migration/ecoroute_supabase_migration.sql` into the Supabase **SQL editor** and run it once.

### 3. Clone the repo and create your `.env`

```bash
git clone https://github.com/pratikkafle608/EcoRoute.git
cd EcoRoute
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and fill in your values. `.env` is git-ignored – never commit it.

### 4. Start the backend

Spring Boot does not read `.env` by itself, so load it into your shell first, then run the app.

**macOS / Linux (bash/zsh):**

```bash
set -a; source .env; set +a
cd demo
./mvnw spring-boot:run
```

**Windows (PowerShell):**

```powershell
Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
cd demo
.\mvnw.cmd spring-boot:run
```

The first run downloads dependencies and takes a few minutes. The backend is ready when you see `Started DemoApplication` – it listens on http://localhost:8080.

> Using IntelliJ instead? Open the `demo` folder, run `DemoApplication`, and add the `.env` values under **Run → Edit Configurations → Environment variables**.

### 5. Start the frontend

In a **second terminal**:

```bash
cd ecoroute-frontend
npm install
npm run dev
```

Open http://localhost:5173, sign up, and calculate your first route.

The frontend calls `http://localhost:8080/api` by default. To point it somewhere else, set `VITE_API_URL` (e.g. in `ecoroute-frontend/.env.local`).

### Troubleshooting

- **`FATAL: EMAXCONNSESSION` / connection errors** – Supabase's session pooler allows only 15 connections in total. Stop other running instances, or lower `DB_POOL_SIZE` in `.env`.
- **Database connection times out** – make sure `SUPABASE_DB_URL` uses the `*.pooler.supabase.com` host and `SUPABASE_DB_USER` is `postgres.<project-ref>`.
- **Port 8080 already in use** – stop the other process, or set `PORT=8081` (and `VITE_API_URL=http://localhost:8081/api` for the frontend).
- **CORS errors in the browser** – the backend only accepts requests from `http://localhost:*`; open the app via `localhost`, not `127.0.0.1`.

## Running with Docker (e.g. on Ubuntu)

The stack is two containers: `frontend` (nginx serving the React build and proxying `/api` to the backend) and `backend` (Spring Boot, not exposed publicly). The database is Supabase.

```bash
# one-time: install Docker Engine + compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in afterwards

git clone https://github.com/pratikkafle608/EcoRoute.git ecoroute && cd ecoroute
cp .env.example .env            # fill in SUPABASE_DB_PASSWORD and API keys
docker compose up -d --build
```

The app is then at `http://<server-ip>` (change `APP_PORT` in `.env` to use another port; open it with `sudo ufw allow 80/tcp` if the firewall is on). Containers restart automatically after reboots. On your own machine with Docker Desktop, the same `docker compose up -d --build` serves the app at http://localhost.

Useful commands: `docker compose logs -f backend`, `docker compose ps`, and after pulling new code `docker compose up -d --build`.
