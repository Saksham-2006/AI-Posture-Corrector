# Posture Pal — Run Locally on Windows

This is a self-contained copy of the Posture Pal app you can run on your Windows machine using just **Node.js** and **npm**. There is no backend — the AI runs entirely inside your browser using your webcam.

---

## What you need before you start

You only need **one** thing installed:

### Node.js (version 20 or newer)

1. Open https://nodejs.org/ in your browser.
2. Click the big green **LTS** button (it says something like "Recommended For Most Users").
3. Run the installer you just downloaded.
4. Click **Next → Next → Install** and accept all the defaults. (npm is included automatically.)
5. When it finishes, click **Finish**.

### Verify the install worked

1. Press the **Windows key**, type `cmd`, and press **Enter** to open Command Prompt.
2. Type the following two commands one at a time and press Enter after each:

   ```
   node --version
   npm --version
   ```

   You should see version numbers like `v20.x.x` and `10.x.x`. If you see those, you're good to go.

---

## Step-by-step: run the app

### 1. Get the project onto your computer

If you downloaded a ZIP from Replit:

1. Find the ZIP file in your **Downloads** folder.
2. **Right-click** it → **Extract All...** → choose where you want it (for example, `C:\Users\YourName\Desktop`) → click **Extract**.
3. Inside the extracted folder, navigate into:
   ```
   windows-local\posture-pal
   ```
   That is the folder you'll be working from.

### 2. Open Command Prompt in the project folder

The easiest way:

1. Open the `windows-local\posture-pal` folder in **File Explorer**.
2. Click in the address bar at the top (where the path is shown).
3. Type `cmd` and press **Enter**.

A black Command Prompt window will open, already pointing at the project folder.

### 3. Install the project's dependencies

In that Command Prompt, type:

```
npm install
```

…and press **Enter**.

This downloads everything the app needs into a folder called `node_modules`. It may take **2 to 5 minutes** depending on your internet speed. You'll see lots of text scrolling — that's normal. Wait until you get your prompt back (the `C:\...>` line).

> If you see a few yellow `WARN` messages, that's fine — only red `ERR!` messages are real problems.

### 4. Start the app

Still in that same Command Prompt, type:

```
npm run dev
```

…and press **Enter**.

After a few seconds you'll see something like:

```
  VITE v7.x.x  ready in 800 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

Your default browser should automatically open to **http://localhost:5173**. If it doesn't, open any browser and paste that address into the address bar.

You should now see Posture Pal running on your computer.

### 5. Allow camera access when asked

When you click **Start session**, your browser will ask for permission to use the webcam. Click **Allow**. Your video never leaves your computer — all the posture detection happens locally in the browser.

### 6. Stop the app when you're done

In the Command Prompt window, press **Ctrl + C** on your keyboard. If it asks "Terminate batch job (Y/N)?", type `Y` and press **Enter**.

To start it again later, just open Command Prompt in the same folder and run `npm run dev` again. You don't need to run `npm install` a second time.

---

## Building a production version (optional)

If you want a built, optimized copy of the site (smaller files, ready to host anywhere):

```
npm run build
npm run preview
```

The first command creates a `dist\` folder with the final files. The second serves them on http://localhost:5173 the same way `npm run dev` does.

---

## Troubleshooting

**"node is not recognized as an internal or external command"**
Node.js wasn't installed correctly, or the installer didn't update your PATH. Close all Command Prompt windows, restart your computer, and try `node --version` again.

**Port 5173 is already in use**
Something else on your machine is using that port. Open `vite.config.ts` in Notepad, find `port: 5173`, change it to something like `port: 5174`, save the file, and run `npm run dev` again.

**Camera shows a black screen / "Looking for you…"**
1. Make sure you clicked **Allow** when the browser asked for camera permission.
2. Close other apps that might be using the camera (Zoom, Teams, Skype, OBS, etc.).
3. Refresh the page.

**MediaPipe / pose model fails to load**
The pose detection model is downloaded from the internet on first run. You need an internet connection the **first** time you start a session. After that, it's cached.

**Browser shows "This site can't be reached"**
The dev server isn't running. Check that the Command Prompt window from step 4 is still open and didn't show any errors. If it crashed, run `npm run dev` again.

**I want to run it on my phone too**
1. In `vite.config.ts`, change `host: "localhost"` to `host: "0.0.0.0"`.
2. Restart with `npm run dev`.
3. Find your PC's local IP (in Command Prompt run `ipconfig` and look for "IPv4 Address" — something like `192.168.1.42`).
4. On your phone (connected to the same Wi-Fi), open `http://192.168.1.42:5173`.

   Note: browsers usually require **HTTPS** for camera access on non-localhost addresses, so the camera may not work this way without extra setup.

---

## What's in this folder

```
posture-pal\
├── index.html          ← the entry HTML page
├── package.json        ← lists what the app depends on
├── vite.config.ts      ← dev server settings (port, etc.)
├── tsconfig.json       ← TypeScript settings
├── public\             ← favicon and og image
└── src\                ← all the React + TypeScript source code
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components\
    ├── features\
    ├── pages\
    └── ...
```

Everything is local. No accounts, no servers, no data leaves your computer.

Enjoy sitting better!
