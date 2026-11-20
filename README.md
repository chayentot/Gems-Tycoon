# Gems Tycoon

Standalone Map 3 export from [GEMS](https://github.com/chayentot/GEMS). The original repository is unchanged.

## Local development
```bash
npm install
npm run dev
```

## Supabase
This project reuses the existing GEMS Supabase project. In **Settings → Secrets and variables → Actions**, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the same project URL and public anon/publishable key as the original site. Never expose a service-role key in frontend code. If the Gold wallet / Map 3 wallet migration has not already been applied in the existing Supabase project, apply the appropriate migration in Supabase SQL Editor. Migrations are not run automatically here.

## GitHub Pages
1. Open **Settings → Pages** and choose **GitHub Actions** as the source.
2. Add the two Supabase Actions secrets above.
3. Push to `main` or run the workflow in the Actions tab.

Published URL: https://chayentot.github.io/Gems-Tycoon/

The export preserves Map 3 gameplay and its Trade interface. It does not add game-inventory persistence or gemstone-to-Gold exchange beyond what the source implementation already supports.
