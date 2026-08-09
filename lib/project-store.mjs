import fs from 'node:fs/promises';
import path from 'node:path';
import { PROJECTS_DIR, UPLOADS_DIR, WORK_DIR, GENERATED_DIR } from './paths.mjs';
import { buildYoutubeMeta } from './youtube-meta.mjs';

async function ensureDirs() {
  const dirs = [PROJECTS_DIR, UPLOADS_DIR, WORK_DIR, GENERATED_DIR];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') console.warn(`mkdir warning for ${dir}:`, err.message);
    }
  }
}

function projectPath(id) { return path.join(PROJECTS_DIR, `${id}.json`); }

export async function createProject(project, audioBuffer, originalName) {
  await ensureDirs();
  const ext = path.extname(originalName || '').toLowerCase() === '.mp3' ? '.mp3' : '.mp3';
  const audioPath = path.join(UPLOADS_DIR, `${project.id}${ext}`);
  await fs.writeFile(audioPath, audioBuffer);
  const now = new Date().toISOString();
  const record = {
    ...project,
    audio_path: audioPath,
    audio_original_name: originalName,
    video_url: null,
    video_path: null,
    render_status: 'queued',
    render_progress: 0,
    render_message: 'MP3 업로드 완료 · 렌더 대기 중',
    render_error: null,
    created_at: now,
    updated_at: now
  };
  await fs.writeFile(projectPath(record.id), JSON.stringify(record, null, 2));
  return record;
}

export async function getProject(id) {
  await ensureDirs();
  try { return JSON.parse(await fs.readFile(projectPath(id), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function listProjects() {
  await ensureDirs();
  const files = (await fs.readdir(PROJECTS_DIR)).filter((name) => name.endsWith('.json'));
  const rows = await Promise.all(files.map(async (file) => JSON.parse(await fs.readFile(path.join(PROJECTS_DIR, file), 'utf8'))));
  return rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function updateProject(id, patch) {
  const current = await getProject(id);
  if (!current) return null;
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  const tmp = `${projectPath(id)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2));
  await fs.rename(tmp, projectPath(id));
  return next;
}

export async function retryProject(id) {
  const p = await getProject(id);
  if (!p) throw new Error('프로젝트를 찾을 수 없습니다.');
  
  const meta = buildYoutubeMeta(p);
  return updateProject(id, {
    ...meta,
    render_status: 'queued',
    render_progress: 0,
    render_message: '재시도 대기 중',
    render_error: null
  });
}

export async function claimNextQueued() {
  const rows = await listProjects();
  const target = rows.filter((p) => p.render_status === 'queued').sort((a,b) => new Date(a.created_at)-new Date(b.created_at))[0];
  if (!target) return null;
  return updateProject(target.id, { render_status: 'preparing', render_progress: 5, render_message: '인트로 준비 중' });
}
