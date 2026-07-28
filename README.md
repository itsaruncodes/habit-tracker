# Habit Tracker — Student/Admin App

## ⚠️ If you already ran the app before and saw "infinite recursion detected"

Run `supabase_fix_recursion.sql` once in Supabase's SQL Editor (same steps as
Part 1 below). It patches the broken policy without touching your existing
data or accounts — nothing else needs to change.

## What's new in this version

- Fixed the "infinite recursion" database bug
- Redesigned UI: cleaner cards, spacing, colors, empty states
- Edit habit names (tap the pencil icon)
- Admin can promote/demote any account to admin right from the app (tap their role badge) — no more manually editing the Supabase table

## What's in this version

- Real login with email + password (Supabase Auth), no more anonymous sign-in
- Signup restricted to @gmail.com addresses
- Password rule: 8+ characters, lowercase letters + numbers only, at least one of each
- Every new signup automatically gets a "student" role
- You become "admin" by flipping one field in the Supabase table editor (see Part 3)
- Students see the habit tracker. Admins see a read-only list of every registered account.
- Passwords are hashed by Supabase — nobody, including the admin, can ever see them in plain text. That part can't be changed; it's how secure auth works.

---

## Part 1 — Supabase project setup (5 min)

1. Go to supabase.com → sign up (free) → **New Project**
2. Name it `habit-tracker`, set a database password (save it), pick your region, **Create new project** (~1-2 min to spin up)
3. Left sidebar → **SQL Editor** → **New query**
4. Open `supabase_schema.sql` from this folder, copy all of it, paste in, click **Run**. You should see "Success."
   4b. Then do the same with `supabase_fix_recursion.sql` — new query, paste, Run. This prevents the recursion bug from ever happening.
5. Left sidebar → **Authentication** → **Providers** → make sure **Email** is enabled (it is by default)
6. Left sidebar → **Authentication** → **Settings** → if you don't want to deal with email confirmation links while testing, turn **"Confirm email"** OFF. (Turn it back on later if you want it for real use.)
7. Left sidebar → **Project Settings** (gear icon) → **API** → copy the **Project URL** and **anon public key**

## Part 2 — Wire up the project on your laptop

1. Open `supabaseClient.js` in this folder, replace:
   ```js
   const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```
   with the values from step 7 above. Save.
2. If you don't have Node.js: install the LTS version from nodejs.org.
3. Open a terminal inside this folder and run:
   ```
   npm install
   ```
4. Run:
   ```
   npx expo start
   ```
   A QR code appears.

## Part 3 — Test it and make yourself admin

1. Install **Expo Go** from the Play Store on your phone.
2. Scan the QR code from your terminal (phone and laptop on the same WiFi).
3. In the app, tap **Sign up**, use your Gmail address and a password like `abc12345`.
4. Back in Supabase dashboard → **Table Editor** → `profiles` → find your row → change `role` from `student` to `admin` → save.
5. Log out and log back in inside the app — you'll now land on the Admin screen instead of the habit tracker.
6. Any other Gmail address that signs up stays a `student` and only sees their own habit tracker. You can see all of them listed under the Admin screen, and in the `profiles`/`habits` tables in Supabase directly.

## Part 4 — Build a real standalone APK (no laptop, no Expo Go needed)

1. Make a free account at expo.dev
2. `npm install -g eas-cli` then `eas login`
3. `eas build:configure` → choose Android, accept defaults
4. Open the `eas.json` it creates, make sure the `preview` profile has:
   ```json
   "android": { "buildType": "apk" }
   ```
5. `eas build -p android --profile preview` — builds on Expo's free servers, ~10-15 min
6. Download link appears in the terminal and on expo.dev under your project's Builds tab
7. Open that link on your phone, download and tap the `.apk` to install (allow "install from unknown sources" if prompted)

That APK is what you'd share with friends/students — each person who signs up gets their own student account and their own private habit list, and you can see all of them from your Admin screen.

## Note on limits

- You can view and manage accounts, but you can't delete a user's login itself from inside the app — that requires Supabase's service-role key, which should never be shipped inside a mobile app (anyone could extract it and get full admin access to your database). If you need to remove someone, do it from the Supabase dashboard → Authentication → Users.
