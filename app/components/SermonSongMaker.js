'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const quickWorship = ['주일예배', '수요기도회', '금요기도회'];
const moreWorship = ['새벽예배', '특별예배', '절기예배', '부서예배', '수련회', '기타'];

function statusLabel(status) {
  return {
    queued: '대기 중',
    preparing: '인트로 준비 중',
    rendering: '영상 생성 중',
    encoding: '최종 인코딩 중',
    completed: '완료',
    failed: '실패'
  }[status] || status;
}

function formatDate(date) {
  if (!date) return '';
  return date.replaceAll('-', '.');
}

async function copyText(text) {
  await navigator.clipboard.writeText(text || '');
}

export default function SermonSongMaker() {
  const [form, setForm] = useState({
    songTitle: '', scripture: '', worshipType: '주일예배', worshipDate: '',
    preacher: '', sermonSeries: '', sermonTitle: '', templateId: 'gold',
    lyrics: '', includeLyricsInDescription: true, lyricsDisplayMode: 'full'
  });
  const [audioFile, setAudioFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [descriptionTab, setDescriptionTab] = useState('auto');
  const polling = useRef(null);

  const active = useMemo(() => projects.find((p) => p.id === activeId) || null, [projects, activeId]);

  async function loadProjects() {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setProjects(data.projects || []);
  }

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    clearInterval(polling.current);
    const hasRunning = projects.some((p) => ['queued', 'preparing', 'rendering', 'encoding'].includes(p.render_status));
    if (hasRunning) polling.current = setInterval(loadProjects, 1800);
    return () => clearInterval(polling.current);
  }, [projects]);

  function updateWorshipType(type) {
    const defaultTpl = type === '주일예배' ? 'gold' : type === '수요기도회' ? 'blue' : type === '금요기도회' ? 'burgundy' : 'navy-gold';
    setForm((prev) => ({ ...prev, worshipType: type, templateId: defaultTpl }));
  }

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setError('');
    setAudioFile(file);
    setAudioBuffer(null);
    if (file) {
      try {
        const buf = await file.arrayBuffer();
        setAudioBuffer(buf);
      } catch (err) {
        console.error('File read error:', err);
        setError('선택한 MP3 파일을 읽을 수 없습니다. 파일을 다시 선택해 주세요.');
      }
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!audioFile) return setError('MP3 파일을 선택해 주세요.');
    if (!form.songTitle.trim()) return setError('찬양 제목을 입력해 주세요.');
    if (!form.scripture.trim()) return setError('성경 본문을 입력해 주세요.');
    if (!form.worshipDate) return setError('예배 날짜를 선택해 주세요.');

    setBusy(true);
    try {
      let buffer = audioBuffer;
      if (!buffer) {
        try {
          buffer = await audioFile.arrayBuffer();
        } catch (readErr) {
          throw new Error('선택한 MP3 파일 권한이 만료되었습니다. MP3 파일 상자를 클릭하여 파일을 다시 선택해 주세요.');
        }
      }

      const metaObj = {
        ...form,
        audioName: audioFile.name,
        include_lyrics_in_description: form.includeLyricsInDescription,
        lyrics_display_mode: form.lyricsDisplayMode
      };
      const metaParam = encodeURIComponent(JSON.stringify(metaObj));
      const res = await fetch(`/api/projects?meta=${metaParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      });

      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`서버 오류 (${res.status}): ${text.slice(0, 100) || '알 수 없는 응답입니다.'}`);
        }
      }
      if (!res.ok) throw new Error(data.error || '프로젝트 생성에 실패했습니다.');
      setActiveId(data.project.id);
      await loadProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit Error:', err);
      const msg = err && err.message ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('could not be read')) {
        setError('선택한 MP3 파일 권한이 만료되었습니다. MP3 파일 상자를 클릭하여 파일을 다시 선택해 주세요.');
      } else {
        setError(msg || '요청 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function retry(id) {
    await fetch(`/api/projects/${id}/retry`, { method: 'POST' });
    setActiveId(id);
    await loadProjects();
  }

  function handleReset() {
    setForm({
      songTitle: '', scripture: '', worshipType: '주일예배', worshipDate: '',
      preacher: '', sermonSeries: '', sermonTitle: '', templateId: 'gold',
      lyrics: '', includeLyricsInDescription: true, lyricsDisplayMode: 'full'
    });
    setAudioFile(null);
    setAudioBuffer(null);
    setError('');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  function handleLoadIntoForm(p) {
    if (!p) return;
    setForm({
      songTitle: p.song_title || '',
      scripture: p.scripture || '',
      worshipType: p.worship_type || '주일예배',
      worshipDate: p.worship_date || '',
      preacher: p.preacher || '',
      sermonSeries: p.sermon_series || '',
      sermonTitle: p.sermon_title || '',
      templateId: p.template_id || 'gold',
      lyrics: p.lyrics || '',
      includeLyricsInDescription: p.include_lyrics_in_description !== false,
      lyricsDisplayMode: p.lyrics_display_mode || 'full'
    });
    setError('');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="eyebrow">PAUL의 믿음일기 · v1.2</div>
        <h1>설교찬양 영상 만들기</h1>
        <p>MP3 선택 → 예배 정보 & 가사 입력 → 영상 만들기. 벧엘교회 전용 템플릿과 썸네일 3종이 제공됩니다.</p>
        {active && (
          <div className={`status-panel ${active.render_status === 'failed' ? 'danger' : ''}`}>
            <div className="status-row">
              <strong>{active.song_title}</strong>
              <span>{statusLabel(active.render_status)}</span>
            </div>
            <div className="progress"><i style={{ width: `${active.render_progress || 0}%` }} /></div>
            <div className="muted">{active.render_message || `${active.render_progress || 0}%`}</div>
            <div className="result-actions" style={{ marginTop: '10px' }}>
              {active.render_status === 'failed' && <button className="secondary" onClick={() => retry(active.id)}>다시 만들기</button>}
              {active.render_status === 'completed' && (
                <>
                  <a className="primary" href={active.video_url} download={`${(active.song_title || '설교찬양').replace(/[/\\?%*:|"<>]/g, '_')}.mp4`}>MP4 저장</a>
                  <a className="secondary" href={active.video_url} target="_blank">미리보기</a>
                </>
              )}
              <button type="button" className="ghost" onClick={() => handleLoadIntoForm(active)}>📝 이 정보로 폼 채우기</button>
            </div>
          </div>
        )}
      </section>

      <form className="form-card" onSubmit={submit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="section-title" style={{ margin: 0 }}><span>1</span><div><strong>MP3 선택</strong><small>최대 30MB · MP3 권장</small></div></div>
          <button type="button" className="ghost" onClick={handleReset} style={{ fontSize: '13px' }}>✨ 입력 폼 초기화</button>
        </div>

        <label className="file-drop">
          <input type="file" accept="audio/mpeg,.mp3" onChange={handleFileChange} />
          <b>{audioFile ? audioFile.name : 'MP3 파일을 선택하세요'}</b>
          <small>{audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(1)} MB` : '휴대폰의 다운로드/음악 폴더에서 선택'}</small>
        </label>

        <div className="section-title"><span>2</span><div><strong>예배 정보 & 가사</strong><small>영상과 YouTube 메타데이터에 사용됩니다.</small></div></div>
        <label>찬양 제목<input value={form.songTitle} onChange={(e) => update('songTitle', e.target.value)} placeholder="구원받은 나그네" /></label>
        <label>본문 말씀<input value={form.scripture} onChange={(e) => update('scripture', e.target.value)} placeholder="베드로전서 1:13-25" /></label>

        <div className="field-label">예배 구분 (선택 시 템플릿 자동 지정)</div>
        <div className="worship-grid">
          {quickWorship.map((name) => (
            <button type="button" key={name} className={form.worshipType === name ? 'chip selected' : 'chip'} onClick={() => updateWorshipType(name)}>{name}</button>
          ))}
          <select value={moreWorship.includes(form.worshipType) ? form.worshipType : ''} onChange={(e) => e.target.value && updateWorshipType(e.target.value)}>
            <option value="">기타 ▼</option>{moreWorship.map((name) => <option key={name}>{name}</option>)}
          </select>
        </div>

        <div className="two-col">
          <label>예배 날짜<input type="date" value={form.worshipDate} onChange={(e) => update('worshipDate', e.target.value)} /></label>
          <label>설교자<input value={form.preacher} onChange={(e) => update('preacher', e.target.value)} placeholder="이성민 담임목사" /></label>
        </div>
        <label>설교 시리즈 / 강해명<input value={form.sermonSeries} onChange={(e) => update('sermonSeries', e.target.value)} placeholder="베드로전서 강해" /></label>
        <label>설교 제목 <em>선택</em><input value={form.sermonTitle} onChange={(e) => update('sermonTitle', e.target.value)} placeholder="설교 제목과 찬양 제목이 다를 때만" /></label>
        
        <label>찬양 가사 <em>선택 입력</em>
          <textarea
            rows={4}
            value={form.lyrics}
            onChange={(e) => update('lyrics', e.target.value)}
            placeholder="1절&#10;주께서는 보셨나이다...&#10;&#10;후렴&#10;주를 의지하나이다..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '6px' }}
          />
          <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>
            💡 <b>직접 작성한 설교찬양 가사</b>는 YouTube 설명란 포함을 권장합니다.<br />
            ⚠️ 기존 CCM 또는 찬송가 가사를 그대로 입력하실 경우 저작권에 유의해 주세요.
          </small>
        </label>

        <div style={{ margin: '14px 0', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#1e293b' }}>
            <input
              type="checkbox"
              checked={form.includeLyricsInDescription}
              onChange={(e) => update('includeLyricsInDescription', e.target.checked)}
            />
            YouTube 설명란에 가사 포함하기
          </label>
          {form.includeLyricsInDescription && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '14px', color: '#334155' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="lyricsDisplayMode"
                  value="full"
                  checked={form.lyricsDisplayMode === 'full'}
                  onChange={(e) => update('lyricsDisplayMode', e.target.value)}
                /> 전체 가사
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="lyricsDisplayMode"
                  value="partial"
                  checked={form.lyricsDisplayMode === 'partial'}
                  onChange={(e) => update('lyricsDisplayMode', e.target.value)}
                /> 1절 + 후렴만
              </label>
            </div>
          )}
        </div>

        <label>템플릿
          <select value={form.templateId} onChange={(e) => update('templateId', e.target.value)}>
            <option value="gold">주일예배 · Gold (벧엘교회 강단 정면)</option>
            <option value="blue">수요기도회 · Blue (차분한 말씀강해)</option>
            <option value="burgundy">금요기도회 · Burgundy (깊은 기도회)</option>
            <option value="navy-gold">기본형 · Deep Navy + Gold (범용)</option>
          </select>
        </label>

        {error && <div className="form-error">{error}</div>}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="make-button" style={{ flex: 1 }} disabled={busy}>{busy ? '업로드 중…' : '🎬 영상 만들기'}</button>
          <button type="button" className="secondary" onClick={handleReset} style={{ padding: '0 16px' }}>✨ 폼 초기화</button>
        </div>
        <p className="helper">버튼을 누른 뒤 페이지를 닫아도 별도 Worker 프로세스가 렌더링을 계속합니다.</p>
      </form>

      {active?.render_status === 'completed' && (
        <section className="meta-card">
          <div className="section-title"><span>3</span><div><strong>YouTube 업로드 정보</strong><small>완료 영상과 함께 바로 복사할 수 있습니다.</small></div></div>
          <MetaBox label="제목" value={active.youtube_title} />
          
          <div className="meta-box">
            <div className="meta-head">
              <b>설명란 (Description)</b>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={descriptionTab === 'auto' ? 'chip selected' : 'chip'}
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                  onClick={() => setDescriptionTab('auto')}
                >설정된 버전</button>
                {active.youtube_description_with_lyrics && (
                  <button
                    type="button"
                    className={descriptionTab === 'with' ? 'chip selected' : 'chip'}
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                    onClick={() => setDescriptionTab('with')}
                  >가사 포함</button>
                )}
                {active.youtube_description_no_lyrics && (
                  <button
                    type="button"
                    className={descriptionTab === 'no' ? 'chip selected' : 'chip'}
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                    onClick={() => setDescriptionTab('no')}
                  >가사 제외</button>
                )}
              </div>
            </div>
            <pre>
              {descriptionTab === 'with' ? active.youtube_description_with_lyrics : descriptionTab === 'no' ? active.youtube_description_no_lyrics : active.youtube_description}
            </pre>
            <button
              type="button"
              style={{ marginTop: '8px' }}
              onClick={() => copyText(descriptionTab === 'with' ? active.youtube_description_with_lyrics : descriptionTab === 'no' ? active.youtube_description_no_lyrics : active.youtube_description)}
            >설명란 전체 복사</button>
          </div>

          <MetaBox label="태그" value={active.youtube_tags} multiline />
          <div className="playlist">추천 재생목록 <b>{active.recommended_playlist}</b></div>

          <div className="section-title" style={{ marginTop: '36px' }}>
            <span>🖼️</span><div><strong>YouTube 썸네일 3종 제안 & AI 프롬프트</strong><small>예배 맞춤형 3가지 스타일 썸네일 제안</small></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
            <ThumbnailStyleCard
              title="1) 클래식 타이틀형 (공식 정석 레이아웃)"
              desc="상단 '설교가 찬양이 되다' + 중앙 큰 제목(폭 60~70%) + 하단 본문 + 우측 상단 예배 구분 라벨 뱃지"
              prompt={active.thumbnail_style_1_prompt || active.thumbnail_prompt}
            />
            <ThumbnailStyleCard
              title="2) 감성 묵상형 (은혜롭고 넉넉한 여백)"
              desc="충분한 여백과 따뜻한 햇살 묵상감 · 성경책 & 십자가 감성 배경 + 중앙 캘리그라피 제목"
              prompt={active.thumbnail_style_2_prompt || active.thumbnail_prompt}
            />
            <ThumbnailStyleCard
              title="3) 벧엘교회 현장형 (벧엘교회 실제 내부 고유 전경)"
              desc="붉은 벽돌, 흰 기둥, 강대상, 십자가 등 벧엘교회 실제 내부 아카이브 배경 기준"
              prompt={active.thumbnail_style_3_prompt || active.thumbnail_prompt}
            />
          </div>
        </section>
      )}

      <section className="history-card">
        <div className="history-head"><div><h2>프로젝트 기록</h2><p>완료 영상 재다운로드·재렌더링 및 폼 채우기</p></div><button className="ghost" onClick={loadProjects}>새로고침</button></div>
        {projects.length === 0 ? <div className="empty">아직 생성한 프로젝트가 없습니다.</div> : projects.map((p) => (
          <article className="history-item" key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="history-main" onClick={() => setActiveId(p.id)} style={{ cursor: 'pointer', flex: 1 }}>
              <b>{p.song_title}</b>
              <span>{formatDate(p.worship_date)} · {p.worship_type}{p.sermon_series ? ` · ${p.sermon_series}` : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="ghost" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); handleLoadIntoForm(p); }}>
                📝 폼에 채우기
              </button>
              <div className={`badge ${p.render_status}`} onClick={() => setActiveId(p.id)} style={{ cursor: 'pointer' }}>
                {statusLabel(p.render_status)} {p.render_progress || 0}%
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function MetaBox({ label, value, multiline }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await copyText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="meta-box">
      <div className="meta-head">
        <b>{label}</b>
        <button type="button" onClick={handleCopy}>{copied ? '✓ 복사됨' : '복사'}</button>
      </div>
      {multiline ? <pre>{value}</pre> : <p>{value}</p>}
    </div>
  );
}

function ThumbnailStyleCard({ title, desc, prompt }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await copyText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{title}</h4>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{desc}</p>
        </div>
        <button type="button" onClick={handleCopy} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          {copied ? '✓ 프롬프트 복사됨' : '프롬프트 복사'}
        </button>
      </div>
      <pre style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0, color: '#334155' }}>
        {prompt}
      </pre>
    </div>
  );
}
