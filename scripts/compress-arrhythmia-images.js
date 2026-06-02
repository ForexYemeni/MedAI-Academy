const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressAndEncode(imagePath) {
  const buffer = await sharp(imagePath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function main() {
  const imagesDir = path.join(__dirname, '..', 'images-arrhythmia');
  const imageKeys = [
    '01-conduction-system', '02-electrophysiology', '03-ecg-basics',
    '04-sinus-rhythms', '05-atrial-fibrillation', '06-atrial-flutter',
    '07-svt', '08-wpw', '09-heart-block-1-2', '10-heart-block-3',
    '11-vtach', '12-vfib', '13-antiarrhythmic-drugs', '14-cardioversion',
    '15-defibrillation', '16-pacemakers', '17-acls-algorithm', '18-management-algorithm'
  ];
  
  const images = {};
  for (const key of imageKeys) {
    const filePath = path.join(imagesDir, `${key}.png`);
    if (fs.existsSync(filePath)) {
      console.log(`Compressing ${key}...`);
      images[key] = await compressAndEncode(filePath);
      console.log(`  Done (${(Buffer.byteLength(images[key]) / 1024).toFixed(1)} KB)`);
    }
  }
  
  // Save compressed images as JSON for the next step
  fs.writeFileSync(path.join(__dirname, 'compressed-images.json'), JSON.stringify(images));
  console.log('\nCompressed images saved to compressed-images.json');
}

main();
