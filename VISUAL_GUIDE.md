# ZenRoute - Visual Step-by-Step Guide

**This guide shows you EXACTLY which buttons to click and where to find them.**

---

## 📸 Visual Guide: Opening Visual Studio Code

### Method 1: From Desktop Icon
1. Look for this icon on your desktop: **`</>`** (VS Code icon)
2. **Double-click** the icon
3. VS Code opens!

### Method 2: From Start Menu
1. Press **Windows Key** (key with Windows logo)
2. Type: **"code"** or **"visual studio code"**
3. You'll see "Visual Studio Code" appear
4. **Click** on it or press **Enter**
5. VS Code opens!

---

## 📂 Visual Guide: Opening Your Project

### Step 1: Open Folder Menu
1. Look at the **top menu bar** in VS Code
2. **Click** on **"File"** (leftmost menu)
3. A dropdown menu appears
4. **Click** on **"Open Folder..."**
   - OR: Press `Ctrl + K`, then `Ctrl + O`

### Step 2: Navigate to Project
1. A file browser window opens
2. On the left side, you'll see:
   - **This PC**
   - **Local Disk (C:)**
   - **Local Disk (E:)** ← Click this!
3. **Double-click** on **"Local Disk (E:)"**
4. **Double-click** on **"CoreDev"**
5. **Double-click** on **"Projects"**
6. **Double-click** on **"aahron"**
7. **Click** the **"Select Folder"** button (bottom right)

✅ **Your project is now open!**

---

## 🖥️ Visual Guide: Understanding VS Code Interface

### Left Sidebar (Activity Bar)
Look at the **left edge** of VS Code. You'll see vertical icons:

```
┌─
│ 📁  ← Explorer (File browser)
│ 🔍  ← Search (Find in files)
│ 🔀  ← Source Control (Git)
│ ▶️  ← Run and Debug
│ 🧩  ← Extensions
└─
```

**Click any icon** to open that panel!

### Top Menu Bar
```
[File] [Edit] [Selection] [View] [Go] [Run] [Terminal] [Help]
```

**Most used menus:**
- **File** - Open, save, close files
- **View** - Show/hide panels
- **Terminal** - Open command terminal

### File Explorer Panel
When you click the **📁 Explorer** icon, you'll see:

```
EXPLORER
├─ 📁 aahron
│  ├─ 📁 .expo
│  ├─ 📁 android
│  ├─ 📁 assets
│  ├─ 📁 docs
│  ├─ 📁 server
│  ├─ 📁 src
│  ├─ 📄 .env
│  ├─ 📄 .gitignore
│  ├─ 📄 App.tsx
│  ├─ 📄 package.json
│  └─ 📄 README.md
```

**To open a file:**
- **Single-click** = Preview (opens in editor)
- **Double-click** = Open in new tab

---

## ⌨️ Visual Guide: Opening Terminal

### Method 1: Using Menu
1. **Click** on **"Terminal"** in the top menu bar
2. **Click** on **"New Terminal"**
3. Terminal appears at the bottom!

### Method 2: Using Keyboard
1. Press: `` Ctrl + ` ``
   - The `` ` `` key is usually above the **Tab** key
   - It's the same key as **~** (tilde)
2. Terminal appears!

### Method 3: Using Command Palette
1. Press: `Ctrl + Shift + P`
2. Type: **"terminal"**
3. **Click** on **"Terminal: Create New Terminal"**
4. Terminal appears!

### What Terminal Looks Like:
```
TERMINAL
─────────────────────────────────────────
PS e:\CoreDev\Projects\aahron> _
                                    ↑
                            Cursor (type here)
```

---

## 🚀 Visual Guide: Starting the Backend Server

### Step 1: Open Terminal
- Press `` Ctrl + ` `` to open terminal
- You'll see: `PS e:\CoreDev\Projects\aahron>`

### Step 2: Navigate to Server Folder
1. **Type**: `cd server`
2. **Press Enter**
3. You'll see: `PS e:\CoreDev\Projects\aahron\server>`

### Step 3: Start Server
1. **Type**: `npm start`
2. **Press Enter**
3. Wait 5-10 seconds
4. You should see:
   ```
   ✓ Database connection successful
   ✓ Server running on http://0.0.0.0:3001
   ✓ WebSocket server ready on ws://0.0.0.0:3001
   ```

✅ **Backend is running!** (Keep this terminal open!)

---

## 📱 Visual Guide: Starting the Frontend App

### Step 1: Open NEW Terminal
1. **Click** on **"Terminal"** menu (top bar)
2. **Click** on **"New Terminal"**
   - OR: Press `` Ctrl + Shift + ` ``
3. A **second terminal** appears

### Step 2: Make Sure You're in Root Folder
1. Look at the terminal prompt
2. Should show: `PS e:\CoreDev\Projects\aahron>`
3. If it shows `server`, type: `cd ..` and press Enter

### Step 3: Start Frontend
1. **Type**: `npm start`
2. **Press Enter**
3. Wait 10-20 seconds
4. You'll see a **QR code** in the terminal!

### What You'll See:
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

┌─────────────────────────────────┐
│                                 │
│        [QR CODE HERE]           │
│                                 │
└─────────────────────────────────┘

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

✅ **Frontend is running!**

---

## 📲 Visual Guide: Testing on Your Phone

### Step 1: Install Expo Go
1. Open **Google Play Store** (Android) or **App Store** (iOS)
2. **Search** for: **"Expo Go"**
3. **Click** **"Install"** button
4. Wait for installation

### Step 2: Scan QR Code
1. **Open Expo Go** app on your phone
2. **Tap** on **"Scan QR code"** button
3. **Point camera** at the QR code in VS Code terminal
4. **Wait** for app to load (30-60 seconds)

✅ **App is running on your phone!**

---

## 💾 Visual Guide: Saving Files

### Method 1: Using Menu
1. **Click** **"File"** in top menu
2. **Click** **"Save"**
   - OR: **"Save All"** to save all open files

### Method 2: Using Keyboard
- Press: `Ctrl + S` (Save current file)
- Press: `Ctrl + K, S` (Save all files)

### Visual Indicator:
- **White circle** next to filename = File has unsaved changes
- **No circle** = File is saved

```
[●] App.tsx  ← Has unsaved changes
[ ] index.js  ← Saved
```

---

## 🔍 Visual Guide: Finding Files

### Method 1: Quick Open
1. Press: `Ctrl + P`
2. A search box appears at the top:
   ```
   🔍 Go to File...
   ```
3. **Type** the filename (e.g., "App.tsx")
4. **Click** on the file or press **Enter**

### Method 2: File Explorer
1. **Click** the **📁 Explorer** icon (left sidebar)
2. **Scroll** through folders
3. **Click** on file to open

---

## 🎯 Visual Guide: Common Buttons

### Top Toolbar Buttons:
```
[←] [→] [↻] [🗂️] [🔍] [⚙️]
 │   │   │    │    │    │
 │   │   │    │    │    └─ Settings
 │   │   │    │    └─ Search
 │   │   │    └─ Explorer
 │   │   └─ Reload Window
 │   └─ Go Forward
 └─ Go Back
```

### Terminal Buttons:
```
TERMINAL                    [+][🗑️][⋮]
─────────────────────────────
│                           │
│  (terminal content)      │
│                           │
─────────────────────────────
```

- **`+`** = New Terminal
- **`🗑️`** = Delete Terminal
- **`⋮`** = More Options

### Editor Tabs:
```
[App.tsx] [index.js] [package.json] [+]
   │        │            │          │
   │        │            │          └─ New File
   │        │            └─ Click to switch
   │        └─ Click to switch
   └─ Current file (active)
```

**To close a tab:**
- **Click** the **X** on the tab
- OR: Press `Ctrl + W`

---

## 🐛 Visual Guide: Reading Error Messages

### Error in Terminal:
```
✗ Error: Cannot find module 'express'
    at Object.<anonymous> (C:\...\index.js:5:15)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
```

**What to do:**
1. **Read** the error message
2. **Look** for keywords like "Cannot find module"
3. **Solution**: Run `npm install`

### Error in Editor:
```
[Problems] 3
─────────────────────────────
❌ index.js (3, 5)
   Cannot find name 'console'
```

**What to do:**
1. **Click** on the **Problems** tab (bottom panel)
2. **Read** the error
3. **Click** on error to jump to the file
4. **Fix** the issue

### Red Underlines:
```
const x = undefinedVariable;
              ^^^^^^^^^^^^^^^^
              Red squiggly line
```

**What it means:**
- There's an error on this line
- **Hover** over it to see error message
- **Fix** the issue

---

## 📋 Visual Guide: Command Palette

### Opening Command Palette:
1. Press: `Ctrl + Shift + P`
2. A box appears at the top:
   ```
   🔍 >
   ```
3. **Type** what you want to do
4. **Click** on the command or press **Enter**

### Common Commands:
- Type: **"terminal"** → Create new terminal
- Type: **"save"** → Save file
- Type: **"format"** → Format document
- Type: **"reload"** → Reload window

---

## 🎨 Visual Guide: File Icons

VS Code uses icons to show file types:

```
📄 .txt, .md          Text files
📝 .js, .ts           JavaScript/TypeScript
🎨 .css, .scss        Stylesheets
📦 .json              Configuration
🗃️ .sql               Database
📱 .tsx, .jsx         React components
🔧 .env               Environment variables
📋 .log               Log files
```

---

## ✅ Visual Checklist: Is Everything Running?

### Check Backend Server:
Look at Terminal 1. You should see:
```
✓ Database connection successful
✓ Server running on http://0.0.0.0:3001
```

✅ **If you see this, backend is running!**

### Check Frontend App:
Look at Terminal 2. You should see:
```
› Metro waiting on exp://...
┌─────────────────┐
│   [QR CODE]     │
└─────────────────┘
```

✅ **If you see QR code, frontend is running!**

### Check for Errors:
- **Red text** in terminal = Error
- **Yellow text** = Warning
- **Green text** = Success
- **White text** = Normal output

---

## 🎓 Visual Guide: Learning the Interface

### Practice Exercise:
1. **Open VS Code**
2. **Open your project** (`Ctrl + K, Ctrl + O`)
3. **Click** the **📁 Explorer** icon (left sidebar)
4. **Click** on `App.tsx` to open it
5. **Press** `Ctrl + P` and type "package"
6. **Open** `package.json`
7. **Press** `` Ctrl + ` `` to open terminal
8. **Type** `npm --version` and press Enter
9. **See** the version number appear

✅ **You've learned the basics!**

---

## 📞 Need Help?

### Where to Look:
1. **Bottom Status Bar** - Shows errors, line numbers
2. **Problems Panel** - Click `Ctrl + Shift + M` to see all errors
3. **Output Panel** - Click "View" → "Output" to see logs
4. **Terminal** - Shows command output and errors

### Getting Help:
1. **Screenshot** the error
2. **Copy** the error message
3. **Check** SETUP_GUIDE.md
4. **Search** online for the error
5. **Contact** developer with details

---

**Remember: Practice makes perfect! Don't be afraid to click around and explore!**
