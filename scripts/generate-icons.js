/**
 * Script pour générer les icônes PWA à partir du SVG
 * Nécessite: npm install --save-dev sharp
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const svgPath = join(publicDir, 'icon.svg');

async function generateIcons() {
  try {
    const svgBuffer = readFileSync(svgPath);
    
    // Générer icon-192.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(join(publicDir, 'icon-192.png'));
    
    console.log('✓ icon-192.png généré');
    
    // Générer icon-512.png
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(join(publicDir, 'icon-512.png'));
    
    console.log('✓ icon-512.png généré');
    
    console.log('✅ Toutes les icônes PWA ont été générées avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error);
    process.exit(1);
  }
}

generateIcons();
