# ZenRoute - Quick Reference Card

**Print this page and keep it near your computer!**

---

## 🚀 Starting the System (Daily Use)

### Step-by-Step:

1. **Open Visual Studio Code**
   - Double-click VS Code icon on desktop
   - OR: Press `Windows Key`, type "Code", press Enter

2. **Open Project**
   - Press `Ctrl + K, Ctrl + O` (Open Folder)
   - Navigate to: `e:\CoreDev\Projects\aahron`
   - Click "Select Folder"

3. **Start Backend Server**
   - Press `` Ctrl + ` `` (Open Terminal)
   - Type: `cd server`
   - Press Enter
   - Type: `npm start`
   - Press Enter
   - ✅ Wait for: "Server running on http://0.0.0.0:3001"

4. **Start Frontend App** (New Terminal)
   - Click "Terminal" menu → "New Terminal"
   - OR: Press `` Ctrl + Shift + ` ``
   - Type: `npm start`
   - Press Enter
   - ✅ Wait for QR code to appear

5. **Test on Phone**
   - Open Expo Go app
   - Scan QR code from terminal
   - App loads!

---

## ⏹️ Stopping the System

1. In each terminal window, press: `Ctrl + C`
2. Type `Y` if asked
3. Close terminals

---

## 🔑 Essential Keyboard Shortcuts

| What You Want | Press This |
|---------------|------------|
| Save file | `Ctrl + S` |
| Open file | `Ctrl + P` |
| New file | `Ctrl + N` |
| Find text | `Ctrl + F` |
| Replace text | `Ctrl + H` |
| Open terminal | `` Ctrl + ` `` |
| New terminal | `` Ctrl + Shift + ` `` |
| Command menu | `Ctrl + Shift + P` |
| File explorer | `Ctrl + Shift + E` |
| Format code | `Shift + Alt + F` |
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Y` |

---

## 📁 Important Files & Locations

| File/Folder | Location | Purpose |
|-------------|----------|---------|
| Database config | `.env` (root) | Database password & settings |
| Database schema | `server/database/schema.sql` | Database structure |
| Backend code | `server/src/index.js` | Main server file |
| Frontend code | `src/` folder | Mobile app code |
| Package files | `package.json` | Dependencies list |

---

## 🗄️ Database Commands

### Access MySQL:
1. Press `Windows Key`
2. Type: `MySQL Command Line Client`
3. Press Enter
4. Enter password

### Common MySQL Commands:
```sql
-- Show all databases
SHOW DATABASES;

-- Use your database
USE aahron_db;

-- Show all tables
SHOW TABLES;

-- Exit MySQL
EXIT;
```

---

## 🐛 Common Problems & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| "node not found" | Reinstall Node.js, restart VS Code |
| "Cannot find module" | Run `npm install` in project folder |
| "Database connection failed" | Check MySQL is running, check `.env` file |
| "Port 3001 in use" | Close other terminals, restart VS Code |
| "QR code not showing" | Make sure you're in root folder, not server folder |
| "App won't load" | Check phone and computer on same Wi-Fi |
| Code changes not showing | Save file (`Ctrl + S`), press `r` in Expo terminal |

---

## 📱 Testing the App

### On Phone (Recommended):
1. Install **Expo Go** from Play Store/App Store
2. Make sure phone and computer on same Wi-Fi
3. Scan QR code from terminal
4. App loads automatically

### On Android Emulator:
1. Start Android Studio emulator
2. In Expo terminal, press: `a`
3. App installs on emulator

### On Web Browser:
1. In Expo terminal, press: `w`
2. Browser opens automatically

---

## 🔄 Reloading the App

When you make code changes:

1. **Save the file**: `Ctrl + S`
2. **Reload app**:
   - In Expo terminal, press: `r` (reload)
   - OR: Shake phone → Tap "Reload"
3. Changes appear!

---

## 📞 Need Help?

1. **Read the error message** - It usually tells you what's wrong
2. **Check SETUP_GUIDE.md** - Full detailed guide
3. **Search online** - Google the error message
4. **Contact developer** - With screenshot and error details

---

## ✅ Daily Checklist

Before starting work:

- [ ] MySQL is running (check Services)
- [ ] VS Code is open with project folder
- [ ] Backend server is running (Terminal 1)
- [ ] Frontend app is running (Terminal 2)
- [ ] QR code is visible in terminal
- [ ] Expo Go app is ready on phone

---

## 🎯 Common Tasks

### Install New Dependencies:
```bash
npm install package-name
```

### Update Dependencies:
```bash
npm update
```

### Clear Expo Cache:
```bash
npx expo start -c
```

### Check Server Status:
Open browser: `http://localhost:3001/health`

### View Database:
Use MySQL Workbench or Command Line Client

---

**Keep this card handy for quick reference!**
