# PersonalFinApp v4 — React Native + Node.js + SQLite
## Sri Lanka Personal Finance — Production Android APK

---

## ONE-TIME SETUP (your machine)

### Step 1 — Install prerequisites
```bash
# Node.js 18+ from https://nodejs.org
node --version   # need 18+

# Java 17 JDK
# Ubuntu:  sudo apt install openjdk-17-jdk
# macOS:   brew install openjdk@17
# Windows: https://adoptium.net

# Android Studio from https://developer.android.com/studio
# After install, open SDK Manager and install:
#   Android SDK Platform 34
#   Android SDK Build-Tools 34.0.0
#   Android SDK Platform-Tools
#   Android Emulator

# Add to ~/.bashrc  (~/.zshrc on Mac):
export ANDROID_HOME=$HOME/Android/Sdk          # Mac: $HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/emulator
source ~/.bashrc
```

### Step 2 — Backend
```bash
cd PersonalFinApp/backend
npm install
cp .env.example .env        # edit JWT_SECRET to something random
node db/migrate.js          # creates SQLite tables
npm start                   # API runs on http://localhost:3000
```

### Step 3 — Mobile (development)
```bash
cd PersonalFinApp/mobile
npm install

# Start Metro bundler (leave running)
npx react-native start

# In NEW terminal - run on device/emulator
npx react-native run-android
```

---

## BUILD RELEASE APK

```bash
cd PersonalFinApp/mobile/android

# Generate keystore (ONE TIME ONLY - keep this file safe!)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore app/personalfinapp-release.keystore \
  -alias personalfinapp \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Set signing env vars (or add to android/gradle.properties)
export MYAPP_STORE_FILE=personalfinapp-release.keystore
export MYAPP_STORE_PASSWORD=YourStorePassword
export MYAPP_KEY_ALIAS=personalfinapp
export MYAPP_KEY_PASSWORD=YourKeyPassword

# Build the APK
./gradlew assembleRelease

# APK is here:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## PROJECT STRUCTURE
```
PersonalFinApp/
├── backend/                    Node.js + Express + SQLite API
│   ├── src/
│   │   ├── server.js           Entry point
│   │   ├── routes/             REST API endpoints
│   │   ├── middleware/         JWT auth, rate limiting
│   │   └── utils/              DB singleton, tax engine, helpers
│   ├── db/
│   │   └── migrate.js          Creates all SQLite tables
│   ├── package.json
│   └── .env.example
│
└── mobile/                     React Native Android App
    ├── src/
    │   ├── screens/            Dashboard, Expenses, Tax, Tools...
    │   ├── components/         Reusable UI (Card, Button, Input...)
    │   ├── navigation/         React Navigation stack + tabs
    │   ├── services/           API client, OCR, PDF, Biometric
    │   ├── store/              Zustand global state
    │   └── utils/              Tax calc, formatters, constants
    ├── android/                Native Android project
    ├── App.tsx                 Root component
    └── package.json
```

---

## TECH STACK

| Layer | Package | Why |
|-------|---------|-----|
| UI Framework | React Native 0.73 | Native Android performance |
| Navigation | @react-navigation/native + stack + tabs | Industry standard |
| State | zustand | Lightweight, no boilerplate |
| Local SQLite | react-native-sqlite-storage | Full SQL on device |
| Auth | jsonwebtoken + react-native-biometrics | JWT + fingerprint |
| HTTP | axios | API calls to backend |
| OCR | @react-native-ml-kit/text-recognition | Google ML Kit (FREE) |
| PDF | react-native-html-to-pdf | Export financial reports |
| Excel | xlsx + react-native-fs | Export spreadsheets |
| Charts | react-native-gifted-charts | Bar/line/pie charts |
| Notifications | @notifee/react-native | Local push notifications |
| Backend | Express 4 + better-sqlite3 | Fast, reliable API |
| Backend Auth | bcryptjs + jsonwebtoken | Secure password hashing |
| Validation | express-validator | Input sanitization |
| Security | helmet + cors + express-rate-limit | Production hardening |

---

## API ENDPOINTS

```
POST   /api/auth/register           Create account
POST   /api/auth/login              Login with password
POST   /api/auth/biometric-login    Login with biometric
GET    /api/auth/me                 Get current user

GET    /api/transactions            List transactions
POST   /api/transactions            Add transaction
PUT    /api/transactions/:id        Edit transaction
DELETE /api/transactions/:id        Delete transaction

GET    /api/income                  List income sources
POST   /api/income                  Add income source

GET    /api/assets                  List assets
POST   /api/assets                  Add asset
GET    /api/liabilities             List liabilities
POST   /api/liabilities             Add liability

GET    /api/goals                   List savings goals
POST   /api/goals                   Create goal
PUT    /api/goals/:id/deposit       Add money to goal

GET    /api/debts                   List loans/debts
POST   /api/debts                   Add debt
GET    /api/debts/:id/schedule      Get amortization schedule

GET    /api/insurance               List policies
POST   /api/insurance               Add policy

GET    /api/reminders               List reminders
POST   /api/reminders               Create reminder

GET    /api/market/fx               Live FX rates (Frankfurter)
GET    /api/market/gold             Live gold price (XAU)

GET    /api/reports/tax             Tax calculation report
GET    /api/reports/networth        Net worth statement

POST   /api/advisor/chat            AI financial advisor
```
