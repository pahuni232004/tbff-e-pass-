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
    if (!['competition', 'showcase'].includes(film_type.toLowerCase())) {
      console.log(`⚠️  Skipping ${name}: Invalid film type "${film_type}" (must be 'competition' or 'showcase')`);
      continue;
    }

    // Track and validate pass count per film
    const filmKey = `${film_title}-${film_type}`;
    filmPassCount[filmKey] = (filmPassCount[filmKey] || 0) + 1;
    
    const maxPasses = film_type.toLowerCase() === 'competition' ? 5 : 8;
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
  const filmTypeLabel = pass.filmType === 'competition' ? 'COMPETITION' : 'SHOWCASE';
  const filmTypeColor = pass.filmType === 'competition' ? '#D4AF37' : '#ff6b35';

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
      background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #0f0520 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .pass-card {
      background: linear-gradient(145deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%);
      border: 3px solid;
      border-image: linear-gradient(135deg, #D4AF37, #CD7F32, #D4AF37) 1;
      border-radius: 20px;
      padding: 0;
      max-width: 400px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .pass-header {
      background: linear-gradient(135deg, #D4AF37 0%, #CD7F32 100%);
      padding: 20px;
      text-align: center;
    }
    .festival-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a0a2e;
      margin-bottom: 5px;
    }
    .pass-type {
      display: inline-block;
      background: ${filmTypeColor};
      color: #1a0a2e;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 1px;
      margin-top: 8px;
    }
    .pass-body {
      padding: 30px;
      text-align: center;
    }
    .holder-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      font-weight: 600;
      color: white;
      margin-bottom: 5px;
    }
    .designation {
      color: #D4AF37;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 20px;
    }
    .film-info {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 25px;
    }
    .film-title {
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .film-type-badge {
      color: ${filmTypeColor};
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .qr-container {
      background: white;
      padding: 15px;
      border-radius: 16px;
      display: inline-block;
      margin-bottom: 20px;
    }
    .qr-container img {
      display: block;
      width: 200px;
      height: 200px;
    }
    .pass-id {
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
      font-family: monospace;
      letter-spacing: 1px;
    }
    .pass-footer {
      background: rgba(0,0,0,0.3);
      padding: 15px;
      text-align: center;
    }
    .footer-text {
      color: rgba(255,255,255,0.6);
      font-size: 0.75rem;
    }
    @media print {
      body { background: white; }
      .pass-card { box-shadow: none; border: 2px solid #1a0a2e; }
    }
  </style>
</head>
<body>
  <div class="pass-card">
    <div class="pass-header">
      <div class="festival-name">The Bhopal Film Festival</div>
      <div style="color: #1a0a2e; font-size: 0.85rem; margin-top: 2px;">21 - 22 February 2026</div>
      <div style="color: #1a0a2e; font-size: 0.85rem;">21 - 22 February 2026</div>
      <div class="pass-type">${filmTypeLabel} FILM</div>
    </div>
    <div class="pass-body">
      <div class="holder-name">${pass.name}</div>
      <div class="designation">${pass.designation}</div>
      <div class="film-info">
        <div class="film-title">${pass.filmTitle}</div>
        <div class="film-type-badge">${pass.filmType} Selection</div>
      </div>
      <div class="qr-container">
        <img src="${qrDataUrl}" alt="QR Code">
      </div>
      <div class="pass-id">${pass.passId}</div>
    </div>
    <div class="pass-footer">
      <div class="footer-text">Present this QR code at the venue entrance for verification</div>
      <div style="margin-top: 8px; font-size: 0.65rem; color: rgba(255,255,255,0.3);">Built by etwot</div>
    </div>
  </div>
</body>
</html>`;
}

generatePasses().catch(console.error);
