# AETHER VALUE — Starter website

A clean, responsive value-list website for Aether Tower Defense, with a trade calculator and an administrator editor.

## Included
- `index.html`, `styles.css`, `app.js`: website UI and functionality
- `config.js`: Supabase project URL and anon/publishable key placeholders
- `supabase_schema.sql`: database table and row-level security policies
- Demo mode: shows clearly fictional example units until Supabase is configured; demo data is read-only.

## 1) Create the database (Supabase)
1. Create a project at https://supabase.com/ (check current free-plan limits).
2. Open **SQL Editor** and run all of `supabase_schema.sql`.
3. In Project Settings / API, copy the Project URL and anon/publishable key.
4. Paste them into `config.js`.
5. Create your account in Supabase Authentication.

## 2) Grant administrator rights safely
The SQL policies require the authenticated user's JWT `app_metadata.role` to equal `admin`.
Do NOT set this through a public client-side page, and do NOT place the service_role key in this project.
For a single-owner setup, use Supabase's trusted dashboard/server-side administrative process to assign `app_metadata`:
```json
{ "role": "admin" }
```
Then sign out and sign back in so the refreshed session token contains the claim. If you do not have a trusted way to set app_metadata, ask for help configuring it before publishing. Do not weaken the database policies to make the editor work.

## 3) Preview locally
Open `index.html` in a modern browser. Without Supabase credentials it runs in read-only demo mode.

For a local web server, from this folder run:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## 4) Publish free with GitHub Pages
1. Create a GitHub account and a new **public** repository (for example `aether-value`).
2. Upload the site files to the repository root.
3. In repository **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
4. GitHub will provide a public URL after deployment.

## Notes
- GitHub Pages hosts the static frontend; Supabase stores the values and handles authentication/database permissions.
- Free-plan limits and provider terms can change; check the current terms before relying on them.
- This is an initial starter, not a finished production service. Add stronger admin account recovery, backups, rate limiting, audit logs, and input validation before a larger public launch.
- This is an unofficial fan-made project and is not affiliated with Aether Tower Defense or Roblox.
