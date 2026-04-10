# NONO (Smart Time Tracker)

**NONO** is a privacy-first, automated time-tracking tool that helps you regain control of your digital life. It runs quietly in your browser, respecting your data while giving you brutal/retro-styled insights into your productivity.

![NONO Dashboard](./dashboard-cover.png)

## ⚡ Quick Start

### 1. Download
**[Download Latest Extension (ZIP)](https://github.com/OneforAll-Deku/NONO/raw/main/release/nono-extension.zip)**  
*(Unzip this file after downloading)*

### 2. Install
1.  Open Chrome and type `chrome://extensions` in the address bar.
2.  Turn on **Developer mode** (top right switch).
3.  Drag and drop the unzipped folder into the page.

### 3. Go
1.  **[Open Dashboard](https://nono-web.vercel.app/)** and Sign In.
2.  Pin the NONO extension 🧩 to see your status.
3.  That's it! Just browse the web, and your stats will appear automatically.

---

## ❓ Troubleshooting

-   **Popup says "Not Connected"?**
    -   Ensure you have opened the Dashboard tab at least once after signing in.
    -   Refresh the Dashboard page.
-   **No data appearing?**
    -   Check that the extension is enabled in `chrome://extensions`.
    -   Ensure you are not in a restricted browser environment (like Incognito, unless allowed).

---

## �‍💻 For Developers

If you want to contribute to NONO or run the full stack locally, follow the guide below.

### Tech Stack
-   **Extension**: Manifest V3, Vanilla JS
-   **Frontend**: React 19, Vite, Tailwind CSS v4
-   **Backend**: Node.js, Express, Supabase (PostgreSQL)

### Local Development Setup

#### 1. Server (`apps/server`)
```bash
cd apps/server
npm install
node index.js
# Runs on localhost:3000
```

#### 2. Web Dashboard (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
# Runs on localhost:5173
```

#### 3. Load Extension (`apps/extension`)
1.  Go to `chrome://extensions`.
2.  Click **Load Unpacked**.
3.  Select the `apps/extension` folder.

For full deployment details, please contact the maintainer.
