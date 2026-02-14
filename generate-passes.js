import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import QRCode from 'qrcode';

const FESTIVAL_NAME = "The Bhopal Film Festival | 21-22 Feb 2026";
const OUTPUT_DIR = './passes';
const PASSES_JSON = './passes/all-passes.json';

// Create output directory
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read and parse CSV
const csvContent = readFileSync('./attendees.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

console.log(`\n🎬 ${FESTIVAL_NAME} - E-Pass Generator\n`);
console.log(`Found ${records.length} attendees in CSV\n`);

// Track passes per film for validation
const filmPassCount = {};
const allPasses = [];

async function generatePasses() {
  for (let i = 0; i < records.length; i++) {
    const person = records[i];
    const { name, email, phone, film_title, film_type, designation } = person;

    // Validate film type
    if (!['competition', 'showcase', 'visitor'].includes(film_type.toLowerCase())) {
      console.log(`⚠️  Skipping ${name}: Invalid film type "${film_type}" (must be 'competition', 'showcase', or 'visitor')`);
      continue;
    }

    // Track and validate pass count per film (visitors have unlimited)
    const isVisitor = film_type.toLowerCase() === 'visitor';
    const filmKey = isVisitor ? `visitor-${name}` : `${film_title}-${film_type}`;
    filmPassCount[filmKey] = (filmPassCount[filmKey] || 0) + 1;
    
    const maxPasses = isVisitor ? Infinity : (film_type.toLowerCase() === 'competition' ? 5 : 8);
    if (filmPassCount[filmKey] > maxPasses) {
      console.log(`❌ Skipping ${name}: ${film_title} (${film_type}) already has ${maxPasses} passes`);
      continue;
    }

    // Generate unique pass ID
    const passId = `TBFF-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`;

    // Create pass data
    const passData = {
      passId,
      name,
      email,
      phone,
      filmTitle: film_title,
      filmType: film_type.toLowerCase(),
      designation,
      festival: FESTIVAL_NAME,
      generatedAt: new Date().toISOString()
    };

    // Generate QR code
    const qrDataString = JSON.stringify(passData);
    
    // Generate QR as PNG file
    const filename = `${passId}_${name.replace(/\s+/g, '_')}.png`;
    const filepath = `${OUTPUT_DIR}/${filename}`;
    
    await QRCode.toFile(filepath, qrDataString, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a0a2e',
        light: '#ffffff'
      }
    });

    // Also generate HTML pass card
    const htmlFilename = `${passId}_${name.replace(/\s+/g, '_')}.html`;
    const qrDataUrl = await QRCode.toDataURL(qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a0a2e',
        light: '#ffffff'
      }
    });

    const passHtml = generatePassHTML(passData, qrDataUrl);
    writeFileSync(`${OUTPUT_DIR}/${htmlFilename}`, passHtml);

    allPasses.push({
      ...passData,
      qrFile: filename,
      htmlFile: htmlFilename
    });

    console.log(`✅ Generated pass for: ${name} (${film_title} - ${film_type}) [${filmPassCount[filmKey]}/${maxPasses}]`);
  }

  // Save all passes data to JSON for reference
  writeFileSync(PASSES_JSON, JSON.stringify(allPasses, null, 2));

  console.log(`\n📁 All passes saved to: ${OUTPUT_DIR}/`);
  console.log(`📋 Pass data saved to: ${PASSES_JSON}`);
  console.log(`\n🎉 Generated ${allPasses.length} passes successfully!\n`);

  // Print summary
  console.log('📊 Summary by Film:');
  console.log('─'.repeat(50));
  for (const [film, count] of Object.entries(filmPassCount)) {
    const [title, type] = film.split('-');
    const max = type === 'competition' ? 5 : 7;
    console.log(`   ${title} (${type}): ${count}/${max} passes`);
  }
  console.log('');
}

function generatePassHTML(pass, qrDataUrl) {
  const isVisitor = pass.filmType === 'visitor';
  let filmTypeLabel, badgeColor, badgeTextColor;
  
  if (pass.filmType === 'competition') {
    filmTypeLabel = 'COMPETITION FILM';
    badgeColor = '#8B1538';
    badgeTextColor = '#E5B848';
  } else if (pass.filmType === 'showcase') {
    filmTypeLabel = 'SHOWCASE FILM';
    badgeColor = '#ff6b35';
    badgeTextColor = '#ffffff';
  } else {
    filmTypeLabel = 'VISITOR PASS';
    badgeColor = '#2E8B8B';
    badgeTextColor = '#ffffff';
  }

  const filmInfoSection = isVisitor ? '' : `
      <div class="film-info">
        <div class="film-title">${pass.filmTitle}</div>
        <div class="film-type-badge">${pass.filmType.toUpperCase()} SELECTION</div>
      </div>`;

  const designationSection = isVisitor ? '' : `
      <div class="designation">${pass.designation}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Pass - ${pass.name} | TBFF 2026</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #E5B848;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .pass-card {
      background: url('app pass template.png') no-repeat center top;
      background-size: cover;
      background-color: #E5B848;
      border: 12px solid #8B1538;
      border-radius: 0;
      padding: 0;
      max-width: 400px;
      width: 100%;
      aspect-ratio: 3/4;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .pass-header {
      padding: 25% 20px 15px;
      text-align: center;
    }
    .festival-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #8B1538;
    }
    .festival-date {
      color: #8B1538;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 2px;
    }
    .pass-type {
      display: inline-block;
      background: ${badgeColor};
      color: ${badgeTextColor};
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 10px;
      border: 2px solid ${badgeColor};
    }
    .pass-body {
      padding: 15px 25px;
      text-align: center;
    }
    .holder-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #4A1520;
      margin-bottom: 5px;
    }
    .designation {
      color: #8B1538;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .film-info {
      background: rgba(139, 21, 56, 0.1);
      border: 2px solid rgba(139, 21, 56, 0.2);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 15px;
    }
    .film-title {
      color: #4A1520;
      font-size: 1rem;
      font-weight: 700;
    }
    .film-type-badge {
      color: #8B1538;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-top: 4px;
    }
    .qr-container {
      background: white;
      padding: 10px;
      border-radius: 12px;
      display: inline-block;
      margin-bottom: 10px;
      border: 3px solid #8B1538;
      box-shadow: 0 4px 20px rgba(139, 21, 56, 0.25);
    }
    .qr-container img {
      display: block;
      width: 140px;
      height: 140px;
    }
    .pass-id {
      color: #8B1538;
      font-size: 0.65rem;
      font-family: monospace;
      letter-spacing: 1px;
      opacity: 0.7;
    }
    .pass-footer {
      background: rgba(139, 21, 56, 0.95);
      padding: 12px;
      text-align: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
    .footer-text {
      color: rgba(255,255,255,0.9);
      font-size: 0.65rem;
    }
    .footer-brand {
      margin-top: 4px;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.75);
      font-weight: 600;
    }
    @media print {
      body { background: white; }
      .pass-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="pass-card">
    <div class="pass-header">
      <div class="festival-name">The Bhopal Film Festival</div>
      <div class="festival-date">21 - 22 February 2026</div>
      <div class="pass-type">${filmTypeLabel}</div>
    </div>
    <div class="pass-body">
      <div class="holder-name">${pass.name}</div>${designationSection}${filmInfoSection}
      <div class="qr-container">
        <img src="${qrDataUrl}" alt="QR Code">
      </div>
      <div class="pass-id">${pass.passId}</div>
    </div>
    <div class="pass-footer">
      <div class="footer-text">Present this QR code at the venue entrance for verification</div>
      <div class="footer-brand">Built by ETWOT</div>
    </div>
  </div>
</body>
</html>`;
}

generatePasses().catch(console.error);
