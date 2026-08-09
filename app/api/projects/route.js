import { randomUUID } from 'node:crypto';
import { createProject, listProjects } from '../../../lib/project-store.mjs';
import { buildYoutubeMeta } from '../../../lib/youtube-meta.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 30 * 1024 * 1024;

export async function GET() {
  const projects = await listProjects();
  return Response.json({ projects });
}

export async function POST(request) {
  try {
    console.log('[API POST /api/projects] Incoming request...');
    const contentType = request.headers.get('content-type') || '';
    const url = new URL(request.url);
    const metaParam = url.searchParams.get('meta') || request.headers.get('x-project-meta');

    let base = {};
    let audioBuffer = null;
    let audioName = 'audio.mp3';

    if (metaParam || contentType.includes('application/octet-stream')) {
      const meta = JSON.parse(decodeURIComponent(metaParam || '{}'));
      base = {
        id: randomUUID(),
        song_title: String(meta.songTitle || '').trim(),
        scripture: String(meta.scripture || '').trim(),
        worship_type: String(meta.worshipType || '주일예배').trim(),
        worship_date: String(meta.worshipDate || '').trim(),
        preacher: String(meta.preacher || '').trim(),
        sermon_series: String(meta.sermonSeries || '').trim(),
        sermon_title: String(meta.sermonTitle || '').trim(),
        template_id: String(meta.templateId || 'gold').trim(),
        lyrics: String(meta.lyrics || '').trim(),
        include_lyrics_in_description: meta.include_lyrics_in_description ?? meta.includeLyricsInDescription ?? true,
        lyrics_display_mode: String(meta.lyrics_display_mode || meta.lyricsDisplayMode || 'full').trim()
      };
      audioName = meta.audioName || 'audio.mp3';
      const arrayBuffer = await request.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      base = {
        id: randomUUID(),
        song_title: String(body.songTitle || '').trim(),
        scripture: String(body.scripture || '').trim(),
        worship_type: String(body.worshipType || '주일예배').trim(),
        worship_date: String(body.worshipDate || '').trim(),
        preacher: String(body.preacher || '').trim(),
        sermon_series: String(body.sermonSeries || '').trim(),
        sermon_title: String(body.sermonTitle || '').trim(),
        template_id: String(body.templateId || 'gold').trim(),
        lyrics: String(body.lyrics || '').trim(),
        include_lyrics_in_description: body.include_lyrics_in_description ?? body.includeLyricsInDescription ?? true,
        lyrics_display_mode: String(body.lyrics_display_mode || body.lyricsDisplayMode || 'full').trim()
      };
      if (body.audioName) audioName = body.audioName;
      if (!body.audioBase64) return Response.json({ error: 'MP3 데이터가 없습니다.' }, { status: 400 });
      
      const base64Data = body.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const fd = await request.formData();
      const audio = fd.get('audio');
      if (!(audio instanceof File)) {
        return Response.json({ error: 'MP3 파일이 없습니다.' }, { status: 400 });
      }
      audioName = audio.name;
      base = {
        id: randomUUID(),
        song_title: String(fd.get('songTitle') || '').trim(),
        scripture: String(fd.get('scripture') || '').trim(),
        worship_type: String(fd.get('worshipType') || '주일예배').trim(),
        worship_date: String(fd.get('worshipDate') || '').trim(),
        preacher: String(fd.get('preacher') || '').trim(),
        sermon_series: String(fd.get('sermonSeries') || '').trim(),
        sermon_title: String(fd.get('sermonTitle') || '').trim(),
        template_id: String(fd.get('templateId') || 'gold').trim(),
        lyrics: String(fd.get('lyrics') || '').trim(),
        include_lyrics_in_description: fd.get('include_lyrics_in_description') === 'true' || fd.get('includeLyricsInDescription') === 'true',
        lyrics_display_mode: String(fd.get('lyrics_display_mode') || fd.get('lyricsDisplayMode') || 'full').trim()
      };
      audioBuffer = Buffer.from(await audio.arrayBuffer());
    }

    console.log(`[API POST /api/projects] Processing file: ${audioName}, size=${audioBuffer.length} bytes`);

    if (audioBuffer.length <= 0 || audioBuffer.length > MAX_BYTES) {
      return Response.json({ error: 'MP3 파일은 30MB 이하만 업로드할 수 있습니다.' }, { status: 400 });
    }

    if (!base.song_title || !base.scripture || !base.worship_date) {
      return Response.json({ error: '찬양 제목, 본문, 예배 날짜는 필수입니다.' }, { status: 400 });
    }

    const meta = buildYoutubeMeta(base);
    const project = await createProject({ ...base, ...meta }, audioBuffer, audioName);
    console.log(`[API POST /api/projects] Successfully created project ${project.id}`);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    console.error('[API POST /api/projects Error]:', error);
    return Response.json({ error: `프로젝트 생성 중 오류가 발생했습니다: ${error.message}` }, { status: 500 });
  }
}
