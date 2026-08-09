import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function filterPath(value) {
  return value.replaceAll('\\', '/').replaceAll("'", "\\'").replaceAll(':', '\\:');
}

const fontPath = filterPath('C:\\Windows\\Fonts\\malgunbd.ttf');
const txtFile = path.resolve('./.data/test_text.txt');
fs.writeFileSync(txtFile, 'Paul의 믿음일기', 'utf8');

const outImg = path.resolve('./public/test_font.png');
const vf = `drawtext=fontfile='${fontPath}':textfile='${filterPath(txtFile)}':fontcolor=0x111111:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:borderw=2:bordercolor=0xffffff`;

execSync(`ffmpeg -y -f lavfi -i color=c=white:s=800x200:d=1 -vf "${vf}" -frames:v 1 "${outImg}"`);
console.log('Test image generated at:', outImg);
