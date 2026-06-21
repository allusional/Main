# ☕ Bean Diary — your personal coffee journal

A little app to log every coffee you drink — beans you buy, cafés you visit, and
your home espresso/pour-over experiments. Rate them, add tasting notes, and keep
it all in one place.

It's a **PWA** (Progressive Web App): a website that installs onto your phone like
a real app, runs offline, and keeps an icon on your home screen. No app store, no
sign-up. Everything is saved **only on your phone** (in the browser), so your notes
stay private to you.

> First time with GitHub? Welcome 👋 Follow the steps below — they take about 3 minutes.

---

## ✨ What it does

- Log a coffee as a **café** drink or a **home brew**
- Track bean/blend, roaster, origin, brew method, roast level, price, and date
- ⭐ 1–5 star rating + free-text tasting notes
- Search and filter your history
- Summary stats: total entries, average rating, your most-used brew method
- Works fully **offline** once installed

---

## 🚀 Get it onto your phone (one-time setup)

### Step 1 — Turn on free hosting (GitHub Pages)

1. On GitHub, open this repository in your browser.
2. Click **Settings** (top menu) → **Pages** (left sidebar).
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. That's it. There's already a workflow in this repo that publishes the app.

### Step 2 — Let it publish

1. Go to the **Actions** tab of the repo.
2. You should see a run named *"Deploy Bean Diary to GitHub Pages"*. Wait for the
   green ✔ (about a minute). If it didn't start, click the workflow on the left
   and press **Run workflow**.
3. When it finishes, go back to **Settings → Pages** — the link to your live app
   is shown at the top (something like
   `https://<your-username>.github.io/Main/`).

### Step 3 — Install on your Android phone

1. Open that link in **Chrome** on your phone.
2. Tap the **⋮** menu (top-right) → **Add to Home screen** / **Install app**.
   (You may also see an **Install** button inside the app's top bar — tap that.)
3. Confirm. Bean Diary now lives on your home screen and opens like any other app,
   even with no internet.

---

## 🧑‍💻 Run it on your computer first (optional)

Want to try it before publishing? From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

---

## 🗂️ What's in here

| File | What it does |
|------|--------------|
| `index.html` | The app's screen layout |
| `styles.css` | The look and feel |
| `app.js` | The logic (saving, searching, rating) |
| `manifest.webmanifest` | Tells the phone it's an installable app |
| `sw.js` | Service worker — makes it work offline |
| `icons/` | App icons |
| `.github/workflows/deploy.yml` | Auto-publishes the app when you push |

## 🔒 Where's my data?

Everything stays in your phone's browser storage. Nothing is uploaded anywhere.
If you clear your browser data or uninstall, the entries are removed — so this is
a personal journal, not a cloud backup.

---

Made as a friendly first GitHub project. Enjoy your coffee ☕
