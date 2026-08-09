import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const baseDir = 'C:/Users/beetl/.gemini/antigravity-ide/brain/c41cb853-4c64-4d85-b431-6766001ff97e';
const targetRoot = 'd:/Project/AntiGravity/sermon-song-maker-mvp/public/templates';

const mapping = {
  gold: {
    intro: 'gold_intro_1786154647654.png',
    main: 'gold_main_1786154659239.png',
    outro: 'gold_outro_1786154672229.png'
  },
  blue: {
    intro: 'blue_intro_1786154684919.png',
    main: 'blue_main_1786154698750.png',
    outro: 'blue_outro_1786154713454.png'
  },
  burgundy: {
    intro: 'burgundy_intro_1786154728082.png',
    main: 'burgundy_main_1786154738887.png',
    outro: 'burgundy_outro_1786154753777.png'
  },
  navy: {
    intro: 'navy_intro_1786154765221.png',
    main: 'gold_main_1786154659239.png',
    outro: 'gold_outro_1786154672229.png'
  }
};

for (const key of Object.keys(mapping)) {
  const files = mapping[key];
  const dir = path.join(targetRoot, key);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const type of ['intro', 'main', 'outro']) {
    const src = path.join(baseDir, files[type]);
    const dst = path.join(dir, `${type}.jpg`);
    console.log(`Processing ${key}/${type} -> ${dst}`);
    execSync(`ffmpeg -y -i "${src}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${dst}"`);
  }
}

execSync(`ffmpeg -y -i "${path.join(baseDir, mapping.navy.intro)}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'intro.jpg')}"`);
execSync(`ffmpeg -y -i "${path.join(baseDir, mapping.navy.main)}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'main.jpg')}"`);
execSync(`ffmpeg -y -i "${path.join(baseDir, mapping.navy.outro)}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" "${path.join(targetRoot, 'outro.jpg')}"`);

console.log('All 4 template sets processed and resized to 1920x1080 successfully!');
