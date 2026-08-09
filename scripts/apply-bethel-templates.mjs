import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const baseDir = 'C:/Users/beetl/.gemini/antigravity-ide/brain/c41cb853-4c64-4d85-b431-6766001ff97e';
const targetRoot = 'd:/Project/AntiGravity/sermon-song-maker-mvp/public/templates';

const bethelIntro = path.join(baseDir, 'media__1786166397604.jpg');
const bethelScreenOutro = path.join(baseDir, 'media__1786166400008.jpg');
const bethelMain = path.join(baseDir, 'media__1786166397604.jpg');

const folders = ['gold', 'blue', 'burgundy', 'navy'];

for (const folder of folders) {
  const dir = path.join(targetRoot, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const introDst = path.join(dir, 'intro.jpg');
  const mainDst = path.join(dir, 'main.jpg');
  const outroDst = path.join(dir, 'outro.jpg');

  console.log(`Processing Bethel Church images for template ${folder}...`);
  execSync(`ffmpeg -y -i "${bethelIntro}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${introDst}"`);
  execSync(`ffmpeg -y -i "${bethelMain}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${mainDst}"`);
  execSync(`ffmpeg -y -i "${bethelScreenOutro}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${outroDst}"`);
}

// Root fallbacks
execSync(`ffmpeg -y -i "${bethelIntro}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'intro.jpg')}"`);
execSync(`ffmpeg -y -i "${bethelMain}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'main.jpg')}"`);
execSync(`ffmpeg -y -i "${bethelScreenOutro}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'outro.jpg')}"`);

console.log('Bethel Church real photos applied to all 4 templates in 1920x1080 resolution successfully!');
