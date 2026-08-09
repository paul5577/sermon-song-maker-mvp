import { claimNextQueued, updateProject } from '../lib/project-store.mjs';
import { renderProject } from '../lib/render.mjs';

const POLL_MS = Number(process.env.WORKER_POLL_MS || 1800);
let stopping = false;

process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

async function processOne() {
  const project = await claimNextQueued();
  if (!project) return false;
  console.log(`[worker] start ${project.id} ${project.song_title}`);
  try {
    const result = await renderProject(project, async (progress, message, status) => {
      await updateProject(project.id, { render_progress: progress, render_message: message, render_status: status });
      console.log(`[worker] ${project.id} ${progress}% ${message}`);
    });
    await updateProject(project.id, { ...result, render_status: 'completed', render_progress: 100, render_message: '영상 생성 완료', render_error: null });
    console.log(`[worker] completed ${project.id} → ${result.video_path}`);
  } catch (error) {
    console.error(`[worker] failed ${project.id}`, error);
    await updateProject(project.id, { render_status: 'failed', render_message: '영상 생성 실패', render_error: error.message, render_progress: 0 });
  }
  return true;
}

console.log(`[worker] Sermon Song Maker render worker started. poll=${POLL_MS}ms`);
while (!stopping) {
  try {
    const didWork = await processOne();
    if (!didWork) await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  } catch (error) {
    console.error('[worker] loop error', error);
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
console.log('[worker] stopped');
