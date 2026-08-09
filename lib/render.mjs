import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { GENERATED_DIR, TEMPLATES_DIR, WORK_DIR } from './paths.mjs';
import { getTemplate } from './templates.mjs';

const INTRO_SECONDS = 5;
const OUTRO_SECONDS = 8;
const FPS = 30;

function run(bin, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stderr) : reject(new Error(`${bin} 종료 코드 ${code}\n${stderr.slice(-5000)}`)));
  });
}

function detectFont() {
  const winDir = process.env.WINDIR || 'C:\\Windows';
  const candidates = [
    process.env.RENDER_FONT,
    path.join(winDir, 'Fonts', 'malgunbd.ttf'),
    path.join(winDir, 'Fonts', 'malgun.ttf'),
    path.join(winDir, 'Fonts', 'Hancom Gothic Bold.ttf'),
    path.join(winDir, 'Fonts', 'batang.ttc'),
    path.join(winDir, 'Fonts', 'gulim.ttc'),
    '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/truetype/unfonts-core/UnDotum.ttf'
  ].filter(Boolean);
  const found = candidates.find((candidate) => fsSync.existsSync(candidate));
  if (!found) throw new Error('한국어 렌더링용 폰트를 찾을 수 없습니다. RENDER_FONT 환경변수로 폰트 경로를 지정하세요.');
  return found;
}

function filterPath(value) {
  return value.replaceAll('\\', '/').replaceAll("'", "\\'").replaceAll(':', '\\:');
}

function drawText({ font, textFile, size, color, y, weight = false }) {
  const border = weight ? ':borderw=2:bordercolor=0x000000aa' : ':borderw=1:bordercolor=0x00000077';
  return `drawtext=fontfile='${filterPath(font)}':textfile='${filterPath(textFile)}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${y}${border}`;
}

async function writeText(dir, name, text) {
  const file = path.join(dir, `${name}.txt`);
  await fs.writeFile(file, '\ufeff' + String(text || ''), 'utf8');
  return file;
}

async function ffprobeDuration(audioPath) {
  const out = await new Promise((resolve, reject) => {
    const child = spawn('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', audioPath]);
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr)));
  });
  const value = Number(out);
  if (!Number.isFinite(value) || value <= 0) throw new Error('MP3 길이를 읽지 못했습니다. 정상적인 MP3인지 확인하세요.');
  return value;
}

function getTemplateImages(templateId) {
  const tpl = getTemplate(templateId);
  const folder = tpl.folder;
  const folderPath = path.join(TEMPLATES_DIR, folder);

  const intro = fsSync.existsSync(path.join(folderPath, 'intro.jpg')) ? path.join(folderPath, 'intro.jpg') : path.join(TEMPLATES_DIR, 'intro.jpg');
  const main = fsSync.existsSync(path.join(folderPath, 'main.jpg')) ? path.join(folderPath, 'main.jpg') : path.join(TEMPLATES_DIR, 'main.jpg');
  const outro = fsSync.existsSync(path.join(folderPath, 'outro.jpg')) ? path.join(folderPath, 'outro.jpg') : path.join(TEMPLATES_DIR, 'outro.jpg');

  return { intro, main, outro, accentColor: tpl.color_accent || '0xe7d7a6' };
}

function detectSerifFont() {
  const winDir = process.env.WINDIR || 'C:\\Windows';
  const candidates = [
    path.join(winDir, 'Fonts', 'batang.ttc'),
    path.join(winDir, 'Fonts', 'HANBatang.ttf'),
    path.join(winDir, 'Fonts', 'malgunbd.ttf')
  ];
  return candidates.find((c) => fsSync.existsSync(c)) || detectFont();
}

function drawSerifTitle({ font, textFile, size, color, y }) {
  const border = ':borderw=3:bordercolor=0x1a0f07cc';
  return `drawtext=fontfile='${filterPath(font)}':textfile='${filterPath(textFile)}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${y}${border}`;
}

async function makeIntroVideo(project, work, font, images) {
  const serifFont = detectSerifFont();
  const texts = {
    channel: await writeText(work, 'intro-channel', 'Paul의 믿음일기'),
    series: await writeText(work, 'intro-series', '설교가 찬양이 되다'),
    title: await writeText(work, 'intro-title', project.song_title),
    scripture: await writeText(work, 'intro-scripture', project.scripture),
    worship: await writeText(work, 'intro-worship', project.worship_type),
    detail: await writeText(work, 'intro-detail', `${project.worship_date.replaceAll('-', '.')}  ${project.preacher ? `· ${project.preacher}` : ''}`)
  };
  const accent = images.accentColor;
  
  // 예시 2번 이미지 100% 동일 프리미엄 레이아웃
  // 좌상단: 설교가 찬양이 되다
  // 중앙: 명조/바탕체 웅장한 캘리그라피 찬양 제목
  // 중앙하단: 성경본문
  // 우하단: 예배구분 뱃지
  const vf = [
    'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080',
    drawText({ font, textFile: texts.series, size: 38, color: '0xffffff', y: 90 }).replace('x=(w-text_w)/2', 'x=100'),
    drawSerifTitle({ font: serifFont, textFile: texts.title, size: 98, color: '0xffffff', y: 410 }),
    drawText({ font, textFile: texts.scripture, size: 52, color: accent, y: 590 }),
    drawText({ font, textFile: texts.detail, size: 32, color: '0xe2eaf0', y: 915 }).replace('x=(w-text_w)/2', 'x=100'),
    drawText({ font, textFile: texts.worship, size: 36, color: accent, y: 910 }).replace('x=(w-text_w)/2', 'x=w-text_w-100')
  ].join(',');

  const out = path.join(work, 'intro_silent.mp4');
  await run('ffmpeg', ['-y','-loop','1','-i',images.intro,'-t',String(INTRO_SECONDS),'-vf',vf,'-r',String(FPS),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-an',out]);
  return out;
}

async function makeMainVideo(project, work, font, duration, images) {
  const mainDuration = Math.max(0.1, duration - INTRO_SECONDS);
  const watermark = await writeText(work, 'watermark', 'Paul의 믿음일기');
  
  const drawVf = drawText({ font, textFile: watermark, size: 28, color: '0xffffffaa', y: 'h-text_h-40' }).replace('x=(w-text_w)/2','x=w-text_w-48');
  
  // 사진 1번과 같이 성전 주위를 깊고 아늑하게 톤다운(비네트)하여 가운데 십자가와 강단 조명만 스포트라이트로 빛나도록 함
  const baseVf = `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,eq=brightness=-0.20:contrast=1.28:saturation=1.08,vignette=angle=0.72,${drawVf}`;
  const out = path.join(work, 'main_silent.mp4');

  // 세련되고 정돈된 연한 샴페인 골드빛 미니 바(Bar) 모양 오디오 비주얼라이저!
  const filterComplex = [
    `[0:v]${baseVf}[bg]`,
    `[1:a]showfreqs=s=300x42:mode=bar:ascale=log:fscale=lin:colors=0xfff6e3ff|0xffe4b8ff[wave]`,
    `[bg][wave]overlay=x=(main_w-overlay_w)/2:y=main_h-152[outv]`
  ].join(';');

  await run('ffmpeg', [
    '-y',
    '-loop', '1', '-i', images.main,
    '-i', project.audio_path,
    '-t', mainDuration.toFixed(3),
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-r', String(FPS),
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '21',
    '-pix_fmt', 'yuv420p',
    '-an',
    out
  ]);
  return out;
}

async function makeOutroVideo(project, work, font, images) {
  const tpl = getTemplate(project.template_id);
  const outroMsg = tpl.outro_message || '오늘 들은 말씀이\n이번 한 주의 삶이 되기를\n기도합니다.';
  
  const message = await writeText(work, 'outro-message', outroMsg);
  const thanks = await writeText(work, 'outro-thanks', '시청해 주셔서 감사합니다.');
  const channel = await writeText(work, 'outro-channel', 'Paul의 믿음일기');

  const drawBlackText = ({ font, textFile, size, color, y, weight = false, lineSpacing = 0 }) => {
    const border = ':borderw=2:bordercolor=0xffffffee';
    const spacing = lineSpacing ? `:line_spacing=${lineSpacing}` : '';
    return `drawtext=fontfile='${filterPath(font)}':textfile='${filterPath(textFile)}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=${y}${border}${spacing}`;
  };

  // 아웃트로 텍스트 위치를 스크린 하단 영역으로 미세 하향 조정 (y: 430, 670, 720)
  const vf = [
    'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080',
    drawBlackText({ font, textFile: message, size: 48, color: '0x111111', y: 430, weight: true, lineSpacing: 14 }),
    drawBlackText({ font, textFile: thanks, size: 32, color: '0x222222', y: 670 }),
    drawBlackText({ font, textFile: channel, size: 26, color: '0x444444', y: 720 })
  ].join(',');
  const out = path.join(work, 'outro.mp4');
  await run('ffmpeg', ['-y','-loop','1','-i',images.outro,'-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100','-t',String(OUTRO_SECONDS),'-vf',vf,'-r',String(FPS),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest',out]);
  return out;
}

export async function renderProject(project, onProgress = async () => {}) {
  const font = detectFont();
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const work = path.join(WORK_DIR, project.id);
  await fs.rm(work, { recursive: true, force: true });
  await fs.mkdir(work, { recursive: true });

  const duration = await ffprobeDuration(project.audio_path);
  const images = getTemplateImages(project.template_id);

  await onProgress(10, '인트로 비디오 생성 중', 'preparing');
  const introVideo = await makeIntroVideo(project, work, font, images);

  await onProgress(30, '본문 비디오 생성 중', 'rendering');
  const mainVideo = await makeMainVideo(project, work, font, duration, images);

  const bodyVideoConcat = path.join(work, 'body_video_concat.txt');
  await fs.writeFile(bodyVideoConcat, [introVideo, mainVideo].map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'));
  const bodyVideoPath = path.join(work, 'body_video.mp4');
  await run('ffmpeg', ['-y','-f','concat','-safe','0','-i',bodyVideoConcat,'-c','copy',bodyVideoPath]);

  await onProgress(60, 'MP3 오디오 결합 중 (0초 시작 & 릴레이)', 'rendering');
  const bodyWithAudioPath = path.join(work, 'body_with_audio.mp4');
  await run('ffmpeg', [
    '-y',
    '-i', bodyVideoPath,
    '-i', project.audio_path,
    '-t', duration.toFixed(3),
    '-af', 'afade=t=in:st=0:d=0.8',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    bodyWithAudioPath
  ]);

  await onProgress(82, '아웃트로 준비 중', 'rendering');
  const outroVideo = await makeOutroVideo(project, work, font, images);

  await onProgress(93, '최종 MP4 인코딩 중', 'encoding');
  const finalConcatFile = path.join(work, 'final_concat.txt');
  await fs.writeFile(finalConcatFile, [bodyWithAudioPath, outroVideo].map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'));
  const finalPath = path.join(GENERATED_DIR, `${project.id}.mp4`);
  await run('ffmpeg', ['-y','-f','concat','-safe','0','-i',finalConcatFile,'-c','copy','-movflags','+faststart',finalPath]);

  const stat = await fs.stat(finalPath);
  await onProgress(100, '완료', 'completed');
  return { video_path: finalPath, video_url: `/generated/${project.id}.mp4`, file_size: stat.size, audio_duration: duration, total_duration: duration + OUTRO_SECONDS };
}
