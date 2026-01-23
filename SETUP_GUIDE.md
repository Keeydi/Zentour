# ZenRoute - Complete Setup Guide for Beginners

**This guide is designed for users with ZERO programming experience. Follow each step carefully.**

---

## 📋 Table of Contents

1. [Required Tools & Applications](#required-tools--applications)
2. [Installation Instructions](#installation-instructions)
3. [Database Setup](#database-setup)
4. [Project Setup](#project-setup)
5. [Running the System](#running-the-system)
6. [Visual Studio Code Guide](#visual-studio-code-guide)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Required Tools & Applications

### Essential Software (Install in this order):

1. **Node.js** (Version 18 or higher)
   - **What it is**: JavaScript runtime needed to run the application
   - **Download**: https://nodejs.org/
   - **Choose**: LTS (Long Term Support) version
   - **File size**: ~50 MB

2. **MySQL** (Version 8.0 or higher)
   - **What it is**: Database to store user and jeepney data
   - **Download**: https://dev.mysql.com/downloads/mysql/
   - **Choose**: MySQL Community Server
   - **File size**: ~200 MB
   - **Important**: Remember the password you set during installation!

3. **Visual Studio Code** (NOT Visual Studio)
   - **What it is**: Code editor to view and edit project files
   - **Download**: https://code.visualstudio.com/
   - **File size**: ~100 MB
   - **Note**: This is FREE and different from Visual Studio

4. **Git** (Optional but recommended)
   - **What it is**: Version control system
   - **Download**: https://git-scm.com/download/win
   - **File size**: ~50 MB

5. **Expo Go App** (For mobile testing)
   - **Android**: Download from Google Play Store
   - **iOS**: Download from App Store
   - **What it is**: App to test your mobile application on your phone

### For Android Development (Optional):
- **Android Studio** (Only if you want to build Android APK)
  - **Download**: https://developer.android.com/studio
  - **File size**: ~1 GB

---

## 📥 Installation Instructions

### Step 1: Install Node.js

1. Go to https://nodejs.org/
2. Click the green button that says **"Download Node.js (LTS)"**
3. Open the downloaded file (e.g., `node-v20.x.x-x64.msi`)
4. Click **"Next"** on the welcome screen
5. Accept the license agreement, click **"Next"**
6. Keep default installation path, click **"Next"**
7. Click **"Next"** (keep default components)
8. Check **"Automatically install the necessary tools"**, click **"Next"**
9. Click **"Install"**
10. Wait for installation to complete
11. Click **"Finish"**

**Verify Installation:**
- Press `Windows Key + R`
- Type `cmd` and press Enter
- Type `node --version` and press Enter
- You should see something like `v20.x.x`
- Type `npm --version` and press Enter
- You should see something like `10.x.x`

### Step 2: Install MySQL

1. Go to https://dev.mysql.com/downloads/mysql/
2. Scroll down and click **"MySQL Community Server"**
3. Click **"Download"** button (choose Windows version)
4. Select **"No thanks, just start my download"**
5. Open the downloaded file (e.g., `mysql-installer-community-x.x.x.x.msi`)
6. Choose **"Developer Default"** installation type, click **"Next"**
7. Click **"Execute"** to install required components
8. Wait for all components to install (may take 10-15 minutes)
9. Click **"Next"** when all components are installed
10. Click **"Next"** on configuration screen
11. Choose **"Standalone MySQL Server"**, click **"Next"**
12. Keep default port (3306), click **"Next"**
13. **IMPORTANT**: Choose **"Use Strong Password Encryption"**, click **"Next"**
14. **SET ROOT PASSWORD**: 
    - Enter a password (e.g., `root123` or your own secure password)
    - **WRITE THIS DOWN** - you'll need it later!
    - Click **"Next"**
15. Click **"Next"** on Windows Service screen
16. Click **"Execute"** to apply configuration
17. Wait for configuration to complete
18. Click **"Finish"**

**Verify Installation:**
- Press `Windows Key`
- Type `MySQL Command Line Client` and press Enter
- Enter your root password
- You should see `mysql>` prompt
- Type `exit` and press Enter to close

### Step 3: Install Visual Studio Code

1. Go to https://code.visualstudio.com/
2. Click the big blue **"Download for Windows"** button
3. Open the downloaded file (e.g., `VSCodeUserSetup-x64-x.x.x.exe`)
4. Accept the license agreement, click **"Next"**
5. Keep default installation path, click **"Next"**
6. **IMPORTANT**: Check these boxes:
   - ✅ **"Add to PATH"**
   - ✅ **"Create a desktop icon"**
   - ✅ **"Register Code as an editor for supported file types"**
7. Click **"Next"**
8. Click **"Install"**
9. Wait for installation
10. Click **"Finish"**
11. **Check the box** "Launch Visual Studio Code" if you want to open it now

### Step 4: Install Git (Optional but Recommended)

1. Go to https://git-scm.com/download/win
2. Click **"Download for Windows"**
3. Open the downloaded file (e.g., `Git-x.x.x-64-bit.exe`)
4. Click **"Next"** through all screens (keep defaults)
5. Click **"Install"**
6. Click **"Finish"**

---

## 🗄️ Database Setup

### Step 1: Create the Database

1. Press `Windows Key`
2. Type `MySQL Command Line Client` and press Enter
3. Enter your MySQL root password
4. You should see `mysql>` prompt

5. Copy and paste this command (press Enter after pasting):
```sql
CREATE DATABASE IF NOT EXISTS aahron_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. You should see: `Query OK, 1 row affected`

### Step 2: Import Database Schema

1. Open **Visual Studio Code**
2. Click **"File"** → **"Open Folder"** (or press `Ctrl + K, Ctrl + O`)
3. Navigate to your project folder: `e:\CoreDev\Projects\aahron`
4. Click **"Select Folder"**

5. In Visual Studio Code, find the file: `server/database/schema.sql`
6. Right-click on `schema.sql` → **"Open in Integrated Terminal"**
   - OR: Click **"Terminal"** menu → **"New Terminal"**
   - OR: Press `` Ctrl + ` `` (backtick key, usually above Tab)

7. In the terminal, type this command and press Enter:
```bash
mysql -u root -p aahron_db < server/database/schema.sql
```

8. Enter your MySQL root password when prompted
9. Wait for the command to complete (no output means success)

**Alternative Method (Using MySQL Workbench):**
1. Open MySQL Workbench (installed with MySQL)
2. Connect to your MySQL server (enter root password)
3. Click **"File"** → **"Open SQL Script"**
4. Navigate to: `e:\CoreDev\Projects\aahron\server\database\schema.sql`
5. Click **"Open"**
6. Click the **"Execute"** button (lightning bolt icon) or press `Ctrl + Shift + Enter`
7. Wait for execution to complete

### Step 3: Configure Database Connection

1. In Visual Studio Code, find the file: `.env` (in the root folder)
2. If `.env` doesn't exist, create it:
   - Right-click in the file explorer → **"New File"**
   - Name it: `.env`
3. Open `.env` file
4. Add these lines (replace `your_password` with your MySQL root password):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=aahron_db
PORT=3001
HOST=0.0.0.0
```

5. Save the file: Press `Ctrl + S`

---

## 📦 Project Setup

### Step 1: Install Frontend Dependencies

1. Open **Visual Studio Code**
2. Open your project folder: `e:\CoreDev\Projects\aahron`
3. Open Terminal:
   - Click **"Terminal"** menu → **"New Terminal"**
   - OR: Press `` Ctrl + ` ``
4. In the terminal, type this command and press Enter:
```bash
npm install
```
5. Wait for installation to complete (may take 2-5 minutes)
6. You should see: `added XXX packages`

### Step 2: Install Backend Dependencies

1. In the same terminal, type:
```bash
cd server
```
2. Press Enter
3. Type:
```bash
npm install
```
4. Press Enter
5. Wait for installation to complete
6. Type:
```bash
cd ..
```
7. Press Enter (to go back to root folder)

### Step 3: Seed Database (Optional - Add Test Accounts)

1. In the terminal, make sure you're in the `server` folder:
```bash
cd server
```
2. Type:
```bash
npm run seed
```
3. Press Enter
4. This will create test accounts in the database

---

## 🚀 Running the System

### IMPORTANT: You need to run TWO things simultaneously:
1. **Backend Server** (Node.js server)
2. **Frontend App** (React Native/Expo app)

### Method 1: Using Two Terminal Windows (Recommended for Beginners)

#### Terminal 1: Start Backend Server

1. Open **Visual Studio Code**
2. Open Terminal: Press `` Ctrl + ` ``
3. Type:
```bash
cd server
```
4. Press Enter
5. Type:
```bash
npm start
```
6. Press Enter
7. **Keep this terminal open!** You should see:
   ```
   ✓ Database connection successful
   ✓ Server running on http://0.0.0.0:3001
   ✓ WebSocket server ready on ws://0.0.0.0:3001
   ```

#### Terminal 2: Start Frontend App

1. In Visual Studio Code, click **"Terminal"** menu
2. Click **"New Terminal"** (this opens a second terminal)
3. In the new terminal, type:
```bash
npm start
```
4. Press Enter
5. **Keep this terminal open!** You should see:
   - A QR code in the terminal
   - Options to press `a` for Android, `i` for iOS, `w` for web

### Method 2: Using One Terminal with Background Process

1. Open Terminal in Visual Studio Code
2. Type:
```bash
cd server
```
3. Press Enter
4. Type:
```bash
npm start
```
5. Press Enter
6. **Open a NEW terminal window** (don't close the first one):
   - Click **"Terminal"** → **"New Terminal"**
7. In the new terminal, type:
```bash
npm start
```
8. Press Enter

### Testing on Your Phone

1. Make sure both servers are running (backend and frontend)
2. Install **Expo Go** app on your phone:
   - Android: Google Play Store
   - iOS: App Store
3. Open **Expo Go** app
4. Scan the QR code shown in the terminal
5. The app should load on your phone!

### Testing on Android Emulator

1. Make sure Android Studio is installed
2. Start an Android emulator from Android Studio
3. In the Expo terminal, press `a` (for Android)
4. The app will install and run on the emulator

### Testing on Web Browser

1. In the Expo terminal, press `w` (for web)
2. A browser window will open automatically
3. The app will load in your browser

---

## 💻 Visual Studio Code Guide

### Opening the Project

1. **Method 1: From File Menu**
   - Click **"File"** → **"Open Folder"**
   - Navigate to: `e:\CoreDev\Projects\aahron`
   - Click **"Select Folder"**

2. **Method 2: From Start Menu**
   - Right-click on project folder in Windows Explorer
   - Select **"Open with Code"**

3. **Method 3: Drag and Drop**
   - Drag the project folder onto Visual Studio Code icon

### Important Buttons and Menus

#### Top Menu Bar:

1. **File Menu** (`Alt + F`)
   - **New File**: `Ctrl + N`
   - **New Window**: `Ctrl + Shift + N`
   - **Open Folder**: `Ctrl + K, Ctrl + O`
   - **Save**: `Ctrl + S`
   - **Save All**: `Ctrl + K, S`
   - **Close Editor**: `Ctrl + W`

2. **Edit Menu** (`Alt + E`)
   - **Undo**: `Ctrl + Z`
   - **Redo**: `Ctrl + Y`
   - **Cut**: `Ctrl + X`
   - **Copy**: `Ctrl + C`
   - **Paste**: `Ctrl + V`
   - **Find**: `Ctrl + F`
   - **Replace**: `Ctrl + H`

3. **View Menu** (`Alt + V`)
   - **Command Palette**: `Ctrl + Shift + P` (Very important!)
   - **Explorer**: `Ctrl + Shift + E` (File browser)
   - **Search**: `Ctrl + Shift + F` (Search in all files)
   - **Terminal**: `` Ctrl + ` `` (Toggle terminal)
   - **Problems**: `Ctrl + Shift + M` (Show errors)

4. **Terminal Menu** (`Alt + T`)
   - **New Terminal**: `` Ctrl + Shift + ` ``
   - **Split Terminal**: `Ctrl + \`

5. **Help Menu** (`Alt + H`)
   - **Welcome**: Shows getting started guide
   - **Documentation**: Opens VS Code docs

#### Left Sidebar Icons (Activity Bar):

1. **Explorer** (📁 icon) - `Ctrl + Shift + E`
   - Shows all files and folders
   - Click to open files

2. **Search** (🔍 icon) - `Ctrl + Shift + F`
   - Search for text across all files
   - Replace text across files

3. **Source Control** (🔀 icon) - `Ctrl + Shift + G`
   - Git version control
   - Shows file changes

4. **Run and Debug** (▶️ icon) - `Ctrl + Shift + D`
   - Run and debug your code
   - Set breakpoints

5. **Extensions** (🧩 icon) - `Ctrl + Shift + X`
   - Install additional features
   - Recommended: ESLint, Prettier, GitLens

#### Bottom Status Bar:

- **Branch name** (if using Git) - Click to switch branches
- **Error count** - Click to see problems
- **Language mode** - Click to change file type
- **Line/Column** - Shows cursor position
- **Spaces/Tabs** - Click to change indentation

### Opening Files

1. **From Explorer**:
   - Click the file in the left sidebar
   - Double-click to open

2. **Quick Open**:
   - Press `Ctrl + P`
   - Type file name
   - Press Enter to open

3. **Recent Files**:
   - Press `Ctrl + R`
   - Select from list

### Editing Files

1. **Save File**: `Ctrl + S`
2. **Save All Files**: `Ctrl + K, S`
3. **Format Document**: `Shift + Alt + F` (Auto-format code)
4. **Go to Line**: `Ctrl + G`, then type line number
5. **Find in File**: `Ctrl + F`
6. **Replace in File**: `Ctrl + H`

### Terminal Usage

1. **Open Terminal**: `` Ctrl + ` ``
2. **New Terminal**: `Ctrl + Shift + \`
3. **Split Terminal**: `Ctrl + \`
4. **Kill Terminal**: Click trash icon on terminal tab
5. **Clear Terminal**: Type `cls` (Windows) or `clear` (Mac/Linux)

---

## ⌨️ Keyboard Shortcuts

### Essential Shortcuts (Memorize These!)

| Action | Windows Shortcut | What It Does |
|--------|------------------|--------------|
| **Save File** | `Ctrl + S` | Saves current file |
| **Save All** | `Ctrl + K, S` | Saves all open files |
| **Open File** | `Ctrl + P` | Quick file search |
| **New File** | `Ctrl + N` | Creates new file |
| **Close File** | `Ctrl + W` | Closes current tab |
| **Undo** | `Ctrl + Z` | Undo last change |
| **Redo** | `Ctrl + Y` | Redo last undo |
| **Cut** | `Ctrl + X` | Cut selected text |
| **Copy** | `Ctrl + C` | Copy selected text |
| **Paste** | `Ctrl + V` | Paste text |
| **Find** | `Ctrl + F` | Find text in file |
| **Replace** | `Ctrl + H` | Find and replace |
| **Select All** | `Ctrl + A` | Select entire file |
| **Go to Line** | `Ctrl + G` | Jump to line number |
| **Toggle Terminal** | `` Ctrl + ` `` | Show/hide terminal |
| **New Terminal** | `` Ctrl + Shift + ` `` | Open new terminal |
| **Command Palette** | `Ctrl + Shift + P` | Open command menu |
| **File Explorer** | `Ctrl + Shift + E` | Show file browser |
| **Search All Files** | `Ctrl + Shift + F` | Search in all files |
| **Format Code** | `Shift + Alt + F` | Auto-format code |
| **Toggle Comment** | `Ctrl + /` | Comment/uncomment line |

### Navigation Shortcuts

| Action | Shortcut | What It Does |
|--------|----------|--------------|
| **Go to Symbol** | `Ctrl + Shift + O` | Jump to function/class |
| **Go to Definition** | `F12` | Go to where symbol is defined |
| **Go Back** | `Alt + ←` | Go to previous location |
| **Go Forward** | `Alt + →` | Go to next location |
| **Find References** | `Shift + F12` | Find all uses of symbol |

### Editor Shortcuts

| Action | Shortcut | What It Does |
|--------|----------|--------------|
| **Duplicate Line** | `Shift + Alt + ↓` | Copy line below |
| **Move Line Up** | `Alt + ↑` | Move line up |
| **Move Line Down** | `Alt + ↓` | Move line down |
| **Delete Line** | `Ctrl + Shift + K` | Delete entire line |
| **Insert Line Above** | `Ctrl + Shift + Enter` | New line above cursor |
| **Insert Line Below** | `Ctrl + Enter` | New line below cursor |
| **Select Word** | `Ctrl + D` | Select word (press again for next occurrence) |
| **Select All Occurrences** | `Ctrl + Shift + L` | Select all matches |

### Terminal Shortcuts

| Action | Shortcut | What It Does |
|--------|----------|--------------|
| **Clear Terminal** | Type `cls` | Clear terminal screen |
| **Kill Process** | `Ctrl + C` | Stop running command |
| **Copy Terminal Text** | Select text, then `Ctrl + C` | Copy selected text |
| **Paste in Terminal** | `Ctrl + V` | Paste text |

### View Shortcuts

| Action | Shortcut | What It Does |
|--------|----------|--------------|
| **Toggle Sidebar** | `Ctrl + B` | Show/hide left sidebar |
| **Toggle Full Screen** | `F11` | Full screen mode |
| **Zoom In** | `Ctrl + +` | Increase font size |
| **Zoom Out** | `Ctrl + -` | Decrease font size |
| **Reset Zoom** | `Ctrl + 0` | Reset to default size |
| **Split Editor** | `Ctrl + \` | Split editor into panes |

---

## 🔧 Troubleshooting

### Problem: "node: command not found" or "npm: command not found"

**Solution:**
1. Node.js is not installed or not in PATH
2. Reinstall Node.js (see Installation Instructions)
3. Restart Visual Studio Code after installation
4. Open new terminal and try again

### Problem: "Cannot find module" errors

**Solution:**
1. Dependencies are not installed
2. In terminal, type: `npm install`
3. Wait for installation to complete
4. If in server folder, also run: `cd server` then `npm install`

### Problem: Database connection failed

**Solution:**
1. Check if MySQL is running:
   - Press `Windows Key`
   - Type "Services" and open it
   - Find "MySQL80" (or similar)
   - Right-click → "Start" if stopped

2. Check `.env` file:
   - Make sure `DB_PASSWORD` matches your MySQL root password
   - Make sure `DB_NAME=aahron_db`

3. Test connection manually:
   - Open MySQL Command Line Client
   - Enter password
   - Type: `USE aahron_db;`
   - If error, database doesn't exist - run schema.sql again

### Problem: Port 3001 already in use

**Solution:**
1. Another instance of the server is running
2. Close all terminals
3. Restart Visual Studio Code
4. Try running `npm start` again in server folder

**Or kill the process:**
1. Press `Ctrl + Shift + Esc` (Task Manager)
2. Find "Node.js" processes
3. Right-click → "End Task"
4. Try running server again

### Problem: Expo QR code not showing

**Solution:**
1. Make sure you're in the root folder (not server folder)
2. Type: `npm start`
3. If still not working, try: `npx expo start`

### Problem: App won't load on phone

**Solution:**
1. Make sure phone and computer are on the same Wi-Fi network
2. Make sure backend server is running (`npm start` in server folder)
3. Try restarting Expo: Press `r` in Expo terminal to reload
4. Clear Expo cache: `npx expo start -c`

### Problem: "Permission denied" errors

**Solution:**
1. Run Visual Studio Code as Administrator:
   - Right-click VS Code icon
   - Select "Run as administrator"
2. Or check file/folder permissions in Windows

### Problem: Code changes not reflecting

**Solution:**
1. **Save the file**: Press `Ctrl + S`
2. **Reload app**: 
   - In Expo terminal, press `r` to reload
   - Or shake phone and tap "Reload"
3. **Restart servers**: Stop both servers (`Ctrl + C`) and restart

### Problem: Terminal shows errors in red

**Solution:**
1. Read the error message carefully
2. Common errors:
   - **"Module not found"**: Run `npm install`
   - **"Port in use"**: Close other terminals or change port
   - **"Database error"**: Check MySQL is running and `.env` is correct
3. Copy the error message and search online for solutions

### Getting Help

1. **Check the error message** - it usually tells you what's wrong
2. **Search online** - Copy error message to Google
3. **Check documentation** - Read README.md files in the project
4. **Ask for help** - Contact the developer with:
   - Screenshot of the error
   - What you were trying to do
   - Steps you already tried

---

## 📝 Quick Reference Card

### Starting the System (Every Time)

1. Open Visual Studio Code
2. Open project folder: `e:\CoreDev\Projects\aahron`
3. Open Terminal: `` Ctrl + ` ``
4. **Terminal 1**: 
   ```bash
   cd server
   npm start
   ```
5. **Terminal 2** (New Terminal):
   ```bash
   npm start
   ```
6. Scan QR code with Expo Go app

### Stopping the System

1. In each terminal, press `Ctrl + C`
2. Type `Y` if asked to confirm
3. Close terminals

### Common Commands

```bash
# Install dependencies
npm install

# Start backend server
cd server
npm start

# Start frontend app
npm start

# Seed database (add test accounts)
cd server
npm run seed

# Check Node.js version
node --version

# Check npm version
npm --version
```

### Important Files

- `.env` - Database configuration (in root folder)
- `server/database/schema.sql` - Database structure
- `package.json` - Frontend dependencies
- `server/package.json` - Backend dependencies

### Important Folders

- `src/` - Frontend source code (React Native)
- `server/src/` - Backend source code (Node.js)
- `server/database/` - Database files
- `android/` - Android-specific files

---

## ✅ Checklist: First Time Setup

Use this checklist to ensure everything is set up correctly:

- [ ] Node.js installed (`node --version` works)
- [ ] MySQL installed and running
- [ ] Database `aahron_db` created
- [ ] Database schema imported (schema.sql)
- [ ] `.env` file created with correct database password
- [ ] Frontend dependencies installed (`npm install` in root)
- [ ] Backend dependencies installed (`npm install` in server folder)
- [ ] Backend server starts without errors
- [ ] Frontend app starts without errors
- [ ] QR code appears in terminal
- [ ] Expo Go app installed on phone
- [ ] App loads on phone after scanning QR code

---

## 🎓 Learning Resources

### Visual Studio Code
- Official Docs: https://code.visualstudio.com/docs
- Keyboard Shortcuts: Press `Ctrl + K, Ctrl + S` in VS Code

### Node.js
- Official Docs: https://nodejs.org/docs/
- npm Docs: https://docs.npmjs.com/

### React Native / Expo
- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/docs/getting-started

### MySQL
- MySQL Docs: https://dev.mysql.com/doc/

---

## 📞 Support Contacts

If you encounter issues not covered in this guide:

1. **Check the error message** - It often contains the solution
2. **Search online** - Google the error message
3. **Check project README** - Look for `README.md` files
4. **Contact developer** - Provide:
   - Screenshot of error
   - What you were doing
   - Steps you tried

---

**Last Updated**: January 2026
**Version**: 1.0
