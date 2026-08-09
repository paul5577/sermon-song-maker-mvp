import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createProject, updateProject } from '../lib/project-store.mjs';
import { buildYoutubeMeta } from '../lib/youtube-meta.mjs';
import { renderProject } from '../lib/render.mjs';

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${bin} failed: ${code}`)));
  });
}

const testAudio = path.join(process.cwd(), '.data', 'test-tone.mp3');
await fs.mkdir(path.dirname(testAudio), { recursive: true });
await run('ffmpeg', ['-y','-f','lavfi','-i','sine=frequency=440:duration=7','-q:a','5',testAudio]);
const id = randomUUID();
const base = {
  id,
  song_title: '구원받은 나그네',
  scripture: '베드로전서 1:13-25',
  worship_type: '주일예배',
  worship_date: '2026-08-02',
  preacher: '이성민 담임목사',
  sermon_series: '베드로전서 강해',
  sermon_title: '구원받은 나그네',
  template_id: 'navy-gold'
};
const source = await fs.readFile(testAudio);
let project = await createProject({ ...base, ...buildYoutubeMeta(base) }, source, 'test.mp3');
const result = await renderProject(project, async (progress, message, status) => {
  console.log(`[test] ${progress}% ${message}`);
  project = await updateProject(id, { render_progress: progress, render_message: message, render_status: status });
});
await updateProject(id, { ...result, render_status: 'completed', render_progress: 100, render_message: '영상 생성 완료' });
console.log('\nRender test passed.');
console.log(result);
