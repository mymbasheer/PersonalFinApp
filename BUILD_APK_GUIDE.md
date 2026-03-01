# How to Build the APK — 3 Methods (No Emulator/Device Needed)

---

## METHOD 1: GitHub Actions (Recommended — Zero Install)

Build in the cloud for FREE. No Android Studio, no SDK, nothing on your PC.

### Steps:

1. **Create a GitHub account** at https://github.com (free)

2. **Create a new repository** — click "New repository", name it `PersonalFinApp`

3. **Upload the project:**
   ```bash
   cd PersonalFinApp
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/PersonalFinApp.git
   git push -u origin main
   ```

4. **Go to Actions tab** on GitHub → your workflow runs automatically

5. **Download APK:**
   - Click the workflow run → scroll down to "Artifacts"
   - Download `PersonalFinApp-release-1.zip`
   - Extract → you have your `app-release.apk`

### Optional: Add Signing Keys (for Play Store submission)
```bash
# Generate a keystore ONCE on your PC (just needs Java installed)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore personalfinapp.keystore \
  -alias personalfinapp \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Encode it to base64
base64 -w 0 personalfinapp.keystore > keystore.b64

# In GitHub → Settings → Secrets → Actions, add:
#   KEYSTORE_BASE64    = contents of keystore.b64
#   KEYSTORE_PASSWORD  = your keystore password
#   KEY_ALIAS          = personalfinapp
#   KEY_PASSWORD       = your key password
```

---

## METHOD 2: Command Line Only (No Android Studio UI)

~500MB download. No emulator. Pure build tools only.

### Step 1: Install Java 17
```bash
# Ubuntu/Debian:
sudo apt install openjdk-17-jdk

# macOS:
brew install openjdk@17

# Windows: download from https://adoptium.net
```

### Step 2: Download Android Command-Line Tools ONLY
```
URL: https://developer.android.com/studio#command-tools
File: commandlinetools-linux-XXXXXXXX_latest.zip  (~100MB)
      commandlinetools-win-XXXXXXXX_latest.zip    (Windows)
      commandlinetools-mac-XXXXXXXX_latest.zip    (macOS)
```

### Step 3: Install SDK (no emulator packages)
```bash
# Linux/macOS
mkdir -p ~/android-sdk/cmdline-tools
unzip commandlinetools-*.zip -d ~/android-sdk/cmdline-tools
mv ~/android-sdk/cmdline-tools/cmdline-tools ~/android-sdk/cmdline-tools/latest

SDKMANAGER=~/android-sdk/cmdline-tools/latest/bin/sdkmanager

# Accept licenses (say yes to all)
yes | $SDKMANAGER --licenses

# Install ONLY what's needed to BUILD — no emulator
$SDKMANAGER "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0
```

### Step 4: Install Node + React Native deps
```bash
# Install Node 18+ from https://nodejs.org
cd PersonalFinApp/mobile
npm install
```

### Step 5: Build the APK
```bash
cd PersonalFinApp/mobile/android
chmod +x gradlew   # Linux/macOS only

# Debug APK (no signing needed, for testing)
./gradlew assembleDebug

# APK location:
# app/build/outputs/apk/debug/app-debug.apk
```

### Step 6: Build SIGNED Release APK
```bash
# Generate keystore (one time)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore app/personalfinapp.keystore \
  -alias personalfinapp \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Set passwords as env vars (or add to gradle.properties)
export MYAPP_STORE_FILE=personalfinapp.keystore
export MYAPP_STORE_PASSWORD=your_password_here
export MYAPP_KEY_ALIAS=personalfinapp
export MYAPP_KEY_PASSWORD=your_password_here

# Build signed release
./gradlew assembleRelease

# APK location:
# app/build/outputs/apk/release/app-release.apk
```

---

## METHOD 3: Android Studio GUI (Easiest for Beginners)

### Step 1: Install Android Studio
- Download from: https://developer.android.com/studio (~1.1GB installer)
- Run installer → click Next → it installs SDK automatically
- **During setup, UNCHECK "Android Virtual Device"** → saves 4GB

### Step 2: Open project
- File → Open → select `PersonalFinApp/mobile/android`
- Wait for Gradle sync (~2–5 minutes first time)

### Step 3: Build APK
- Menu: **Build → Generate Signed Bundle / APK**
- Select: **APK** (not Bundle)
- Create new keystore → fill in details → Next → Release → Finish
- APK saved to: `app/release/app-release.apk`

---

## Install APK on Your Android Phone (No Play Store)

```
1. Copy app-release.apk to your phone (USB / WhatsApp / Google Drive)
2. On phone: Settings → Security → Enable "Unknown Sources" or
             Settings → Apps → Special Access → Install Unknown Apps → Files → Allow
3. Open the APK file on your phone → Install
```

---

## Summary: What You Need for Each Method

| Method          | Install Size | Difficulty | Time  |
|-----------------|-------------|------------|-------|
| GitHub Actions  | 0 MB (cloud)| ⭐ Easy     | 5 min |
| CMD Line only   | ~500 MB     | ⭐⭐ Medium  | 15 min|
| Android Studio  | ~1.1 GB     | ⭐ Easy     | 20 min|

**Recommended: GitHub Actions** — zero install, free, automatic on every code push.
