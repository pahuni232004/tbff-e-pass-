# 🎬 TBFF E-Pass Generator

**The Bhopal Film Festival 2026 - E-Pass QR Code System**

A simple system to generate QR code e-passes for filmmakers and verify them at the festival venue.

---

## 📋 How It Works

1. **Fill the CSV** with attendee details
2. **Run the generator** to create QR codes and pass cards
3. **Email the passes** (HTML files) to each person
4. **Scan at venue** using the scanner page on festival day

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Edit the Attendee List

Open `attendees.csv` and fill in the details:

| Column | Description | Example |
|--------|-------------|---------|
| name | Full name of pass holder | Rajesh Kumar |
| email | Email address | rajesh@example.com |
| phone | Phone number | 9876543210 |
| film_title | Name of the film | The Silent Valley |
| film_type | `competition` or `showcase` | competition |
| designation | Role/title | Director |

**Pass Limits:**
- **Competition films**: 5 passes each
- **Showcase films**: 7 passes each

### Step 3: Generate Passes

```bash
npm run generate
```

This creates:
- `passes/` folder with all generated passes
- Individual PNG QR codes for each person
- Beautiful HTML pass cards ready to email
- `passes/all-passes.json` - master list of all passes

### Step 4: Send Passes via Email

Email each person their HTML file (`TBFF-XXXXX_Name.html`). They can:
- Open it in any browser
- Print it
- Show it on their phone

---

## 📱 Scanning Passes at Venue

### Option 1: Open Scanner Directly
Just open `scanner.html` in any modern browser (Chrome/Safari/Firefox)

### Option 2: Run Local Server
```bash
npm run scanner
```
Then open `http://localhost:3000/scanner.html`

### Scanner Features:
- 📷 Camera-based QR scanning
- 📁 Upload QR image option
- ✅ Shows all attendee details on scan
- ⚠️ Warns if pass already scanned
- 📊 Tracks today's scan history

---

## 📁 File Structure

```
tbff-epass/
├── attendees.csv          # 👈 Edit this with your data
├── generate-passes.js     # QR generator script
├── scanner.html           # Verification scanner
├── package.json
├── README.md
└── passes/                # Generated after running
    ├── TBFF-XXX_Name.png  # QR code images
    ├── TBFF-XXX_Name.html # Beautiful pass cards
    └── all-passes.json    # Master data file
```

---

## 🎨 Pass Card Preview

Each generated HTML pass includes:
- Festival branding
- Pass holder name & designation
- Film title & category
- QR code for scanning
- Unique pass ID

---

## ⚠️ Important Notes

1. **Unique Pass IDs**: Each pass has a unique ID (e.g., `TBFF-M4K8X2J3-001`)
2. **Limit Enforcement**: The generator will skip extra passes if you exceed the limit
3. **Offline Scanning**: Scanner works offline once loaded (history saved locally)
4. **Double-Entry Warning**: Scanner warns if a pass was already scanned

---

## 🔧 Customization

### Change Festival Name
Edit `generate-passes.js`:
```javascript
const FESTIVAL_NAME = "The Bhopal Film Festival 2026";
```

### Change Pass Limits
Edit `generate-passes.js`:
```javascript
const maxPasses = film_type.toLowerCase() === 'competition' ? 5 : 7;
```

---

## 📧 Need Help?

Generated with ❤️ for The Bhopal Film Festival 2026
