# How to Run BulkSend on Your Computer
## Step-by-step guide — no tech experience needed

---

## BEFORE YOU START — Install 3 free programs

You only do this once, ever. Skip any you already have.

---

### Install 1 of 3 — Docker Desktop
This runs the database and message queue in the background.

1. Go to: https://www.docker.com/products/docker-desktop/
2. Click "Download Docker Desktop" (pick Mac with Apple Chip or Intel Chip)
   - To check which Mac you have: click the Apple logo top-left → "About This Mac"
   - If it says "Apple M1/M2/M3/M4" → pick Apple Chip
   - If it says "Intel" → pick Intel Chip
3. Open the downloaded file and drag Docker into your Applications folder
4. Open Docker from Applications
5. Wait until you see a green "Docker is running" in the menu bar (whale icon)

---

### Install 2 of 3 — Node.js
This runs the website code.

1. Go to: https://nodejs.org
2. Click the big green "LTS" button (the recommended version)
3. Open the downloaded file and click through the installer (just keep clicking Next/Continue)
4. When it finishes, close the installer

---

### Install 3 of 3 — pnpm (a package manager)
This downloads all the code libraries the project needs.

1. Open Terminal
   - Press Command + Space, type "Terminal", press Enter
2. Copy and paste this line into Terminal, then press Enter:
   ```
   npm install -g pnpm
   ```
3. Wait for it to finish (you'll see your cursor come back)

---

## PART 1 — Open the project in Terminal

1. Open Terminal (Command + Space → type "Terminal" → Enter)

2. Type this and press Enter:
   ```
   cd ~/Downloads/websiteideas/bulksend
   ```
   You are now "inside" the project folder in Terminal.
   (Every command from here on is typed in this same Terminal window.)

---

## PART 2 — Install the project's code libraries

Type this and press Enter. It will take 1–3 minutes.
```
pnpm install
```
You'll see a lot of text scrolling — that's normal. Wait until the cursor comes back.

---

## PART 3 — Create your settings files

The project needs secret passwords and settings stored in hidden files called ".env files".
Run this command to create them automatically:
```
cp apps/api/.env.example apps/api/.env && cp apps/worker/.env.example apps/worker/.env && cp infra/docker/.env.example infra/docker/.env
```

---

## PART 4 — Edit your settings

You need to open the settings file and fill in a few things.

1. Open the file `apps/api/.env` in any text editor
   - In Terminal, type:
     ```
     open -e apps/api/.env
     ```
   - This opens it in TextEdit

2. You'll see lines like this:
   ```
   DATABASE_URL="postgresql://bulksend:changeme@localhost:5432/bulksend"
   REDIS_URL="redis://:changeme@localhost:6379"
   ```

3. Change the two `changeme` passwords to the same password you'll set in step below.
   For example, change them both to `mypassword123`:
   ```
   DATABASE_URL="postgresql://bulksend:mypassword123@localhost:5432/bulksend"
   REDIS_URL="redis://:mypassword123@localhost:6379"
   ```

4. For now you can leave `SENDGRID_API_KEY` as-is (you only need it when actually sending emails).

5. Save the file (Command + S) and close TextEdit.

6. Now open the Docker settings file:
   ```
   open -e infra/docker/.env
   ```
   Change the two `changeme` lines to the SAME password you used above:
   ```
   POSTGRES_PASSWORD=mypassword123
   REDIS_PASSWORD=mypassword123
   ```
   Save and close.

7. Do the same for the worker:
   ```
   open -e apps/worker/.env
   ```
   Change `changeme` to your same password:
   ```
   REDIS_URL="redis://:mypassword123@localhost:6379"
   DATABASE_URL="postgresql://bulksend:mypassword123@localhost:5432/bulksend"
   ```
   Save and close.

---

## PART 5 — Start the database and message queue

Make sure Docker Desktop is open and running (green whale icon in menu bar), then type:
```
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts 4 things in the background:
- The database (where all your data lives)
- Redis (a fast memory store)
- Kafka (a message queue)
- A web panel to browse Kafka messages

Wait about 30 seconds, then check everything started:
```
docker compose -f infra/docker/docker-compose.yml ps
```
You should see 4 rows all saying "running" or "healthy".

---

## PART 6 — Set up the database tables

This creates all the empty tables in the database (like setting up a new spreadsheet).
```
cd apps/api && pnpm prisma migrate deploy && cd ../..
```
It will print some text and then finish. That's it.

---

## PART 7 — Load sample data

This fills the database with fake sample data so the app isn't completely empty.
```
cd apps/api && pnpm prisma db seed && cd ../..
```

When it finishes you'll see:
```
workspace: (some id)
user: (some id)
tags: 6
contacts: 50
segment: (some id)
campaigns seeded

Seed complete.
  Login: owner@acme.co / password123
```
anscomooi@MacBookAir api % pnpm prisma db seed

Environment variables loaded from .env
Running seed command `tsx ../../infra/db/seed.ts` ...
workspace: 218517ff-983e-4cb9-bd6f-f8cd845b1497
user: 589aea5a-59a6-423d-838c-8f451c3f0503
tags: 6
contacts: 50
segment: d92ed1f5-e75b-47bf-93d8-43dcf514d367
campaigns seeded

Seed complete.
  Login: owner@acme.co / password123

🌱  The seed command has been executed.

Write down that login: **owner@acme.co / password123** — you'll need it in a moment.

---

## PART 8 — Start the app

Now start everything:
```
cd ~/Downloads/websiteideas/bulksend && pnpm dev
```

You'll see a lot of colourful text from 3 apps starting up. When you see lines like:
```
  ➜  Local:   http://localhost:5173/
```
…the app is ready.

---

## PART 9 — Open the app in your browser

1. Open Safari or Chrome
2. Go to: **http://localhost:5173**
3. You should see the BulkSend marketing homepage
4. Click "Sign in" or go to: **http://localhost:5173/login**
5. Log in with:
   - Email: `owner@acme.co`
   - Password: `password123`
6. You'll land on the Dashboard with sample data already loaded

---

## HOW TO STOP EVERYTHING

When you're done working, stop everything cleanly:

1. In Terminal, press **Control + C** to stop the app
2. Then stop Docker:
   ```
   docker compose -f infra/docker/docker-compose.yml down
   ```

---

## HOW TO START AGAIN NEXT TIME

Next time you want to work on it, you only need these 3 steps:

**Step 1** — Make sure Docker Desktop is open (the whale icon)

**Step 2** — Start the database:
```
cd ~/Downloads/websiteideas/bulksend && docker compose -f infra/docker/docker-compose.yml up -d
```

**Step 3** — Start the app:
```
pnpm dev
```

Then open http://localhost:5173 in your browser. That's it.

---

## IF SOMETHING GOES WRONG

**"command not found: pnpm"**
→ Redo the pnpm install step: `npm install -g pnpm`

**"Cannot connect to Docker"**
→ Open Docker Desktop from Applications and wait for the whale icon to go green

**"Port already in use"**
→ Something is already using that port. Restart your computer and try again.

**The page shows an error after logging in**
→ The backend might still be starting. Wait 10 seconds and refresh the page.

**Forgot your password or want to reset sample data**
→ Run this to wipe and reload everything:
```
cd ~/Downloads/websiteideas/bulksend
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d
cd apps/api && pnpm prisma migrate deploy && pnpm prisma db seed && cd ../..
```

---

## USEFUL LINKS WHEN THE APP IS RUNNING

| What                        | Address                        |
|-----------------------------|--------------------------------|
| The website (marketing)     | http://localhost:5173          |
| App login                   | http://localhost:5173/login    |
| Dashboard                   | http://localhost:5173/dashboard|
| API (backend)               | http://localhost:3001          |
| Kafka browser (Redpanda)    | http://localhost:8080          |
