# EcoRoute
A web-application to track the CO2 emmissions of the user as per the distance and the vehicle they are using. It uses real-time data from MapTiler (geocoding) + OSRM (routing), climatiq-api, and OpenAI api to calculate the accurate CO2 emissions and saves it into the user proifile and displays it.

## Running with Docker (e.g. on Ubuntu)

The stack is two containers: `frontend` (nginx serving the React build and proxying `/api` to the backend) and `backend` (Spring Boot, not exposed publicly). The database is Supabase.

```bash
# one-time: install Docker Engine + compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in afterwards

git clone <repo-url> ecoroute && cd ecoroute
cp .env.example .env            # fill in SUPABASE_DB_PASSWORD and API keys
docker compose up -d --build
```

The app is then at `http://<server-ip>` (change `APP_PORT` in `.env` to use another port; open it with `sudo ufw allow 80/tcp` if the firewall is on). Containers restart automatically after reboots.

Useful commands: `docker compose logs -f backend`, `docker compose ps`, and after pulling new code `docker compose up -d --build`.
