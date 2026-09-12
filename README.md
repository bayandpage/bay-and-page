# Bay & Page website

Static store page for **Bay & Page** (books & stationery), Tampa FL.

## GitHub Pages

1. Create a public GitHub repo (e.g. `bay-and-page`).
2. Push these files to the `main` branch.
3. Settings → Pages → Source: Deploy from branch `main` / root.
4. Custom domain: `bayandpage.com` (CNAME file is included).
5. In Cloudflare DNS for `bayandpage.com`, add GitHub Pages records (usually CNAME `www` → `USER.github.io` and A/AAAA or CNAME apex per GitHub docs). Keep Email Routing MX records unchanged.

## Local preview

Open `index.html` in a browser.
