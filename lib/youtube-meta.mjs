import { getTemplate } from './templates.mjs';

const BASE_TAGS = [
  'Paul의믿음일기', '설교가찬양이되다', '설교찬양', '묵상찬양', '기도찬양',
  'CCM', '말씀묵상', '성경말씀', '예배찬양', '은혜찬양',
  '기독교음악', '복음찬양', '찬양가사', '주일예배찬양', '수요기도회찬양',
  '금요기도회찬양', '성경강해', '말씀과찬양', '크리스천', 'CCM추천'
];

const DEFAULT_HASHTAGS = '\n\n#설교가찬양이되다 #Paul의믿음일기 #설교찬양 #묵상찬양 #CCM #예배찬양 #성경말씀 #기도찬양 #찬양음악 #은혜의찬양';

function uniq(items) {
  return [...new Set(items.map((v) => (v || '').trim()).filter(Boolean))];
}

function bibleBook(scripture='') {
  return scripture.trim().split(/\s+/)[0] || '';
}

function buildLyricsSection(lyrics = '', mode = 'full', includeLyrics = false) {
  if (!includeLyrics || !lyrics || mode === 'none') return '';
  const trimmed = lyrics.trim();
  if (!trimmed) return '';

  let textToInclude = trimmed;
  if (mode === 'partial') {
    const lines = trimmed.split('\n');
    textToInclude = lines.slice(0, 12).join('\n');
  }

  return `\n\n────────────────\n\n[가사]\n\n${textToInclude}`;
}

export function buildYoutubeMeta(project) {
  const dateText = project.worship_date || '';
  const songTitle = project.song_title || '설교찬양';
  const scripture = project.scripture || '';
  const worshipType = project.worship_type || '주일예배';

  const title = `🙏 ${songTitle} | ${scripture} | ${worshipType} 설교찬양`;
  
  const baseDescription = `${dateText} ${worshipType}에서 선포된 말씀을 묵상하며\n찬양으로 다시 기록했습니다.\n\n📖 본문\n${scripture}\n\n🎵 찬양\n${songTitle}\n${project.sermon_series ? `\n📚 설교 시리즈\n${project.sermon_series}\n` : ''}${project.preacher ? `\n🎙 설교\n${project.preacher}\n` : ''}\n말씀을 듣는 데서 그치지 않고\n찬양과 묵상을 통해 다시 마음에 새기며\n이번 한 주의 삶으로 살아가기를 기도합니다.\n\n🙏 오늘 들은 말씀이\n이번 한 주의 삶이 되기를 기도합니다.\n\nPaul의 믿음일기\n말씀과 찬양으로 기록하는 신앙의 여정`;

  const lyricsMode = project.lyrics_display_mode || 'full';
  const includeLyrics = project.include_lyrics_in_description !== false;
  const lyricsSection = buildLyricsSection(project.lyrics, lyricsMode, includeLyrics);

  const description = baseDescription + lyricsSection + DEFAULT_HASHTAGS;
  const description_no_lyrics = baseDescription + DEFAULT_HASHTAGS;
  const description_with_lyrics = baseDescription + buildLyricsSection(project.lyrics, 'full', true) + DEFAULT_HASHTAGS;

  const tags = uniq([
    ...BASE_TAGS,
    worshipType,
    bibleBook(scripture),
    project.sermon_title,
    songTitle,
    project.sermon_series,
    project.preacher,
    `${worshipType}설교찬양`,
    `${bibleBook(scripture)}묵상`
  ]).slice(0, 22).join(', ');

  const thumbnail_text_top = '설교가 찬양이 되다';
  const thumbnail_text_main = songTitle;
  const thumbnail_text_bottom = scripture;
  const thumbnail_label = worshipType;

  // 예배별 전용 컬러 및 무드 설정
  let paletteDesc = '';
  let ribbonDesc = '';
  let worshipMood = '';

  if (worshipType === '주일예배') {
    paletteDesc = 'Warm Beige, Soft Creamy Ivory, Soft Warm Gold, and Deep Wood Brown';
    ribbonDesc = 'Rich Gold & Deep Brown hanging ribbon badge';
    worshipMood = 'bright, reverent Sunday worship atmosphere with soft warm golden sunlight';
  } else if (worshipType === '수요기도회') {
    paletteDesc = 'Soft Blue-Gray, Warm Beige, Ivory, and Muted Slate Blue (gentle, warm, not dark or dreary)';
    ribbonDesc = 'Slate Blue & Soft Gray hanging ribbon badge';
    worshipMood = 'serene Wednesday bible-study prayer atmosphere with soft morning light';
  } else if (worshipType === '금요기도회') {
    paletteDesc = 'Burgundy, Warm Beige, Soft Gold, and Rose Beige (graceful prayer mood, not overly dark)';
    ribbonDesc = 'Deep Wine Burgundy & Rose Gold hanging ribbon badge';
    worshipMood = 'deep Friday night prayer meeting atmosphere with warm candle glow and soft golden light';
  } else {
    paletteDesc = 'Neutral Beige, Soft Brown, and Soft Gold';
    ribbonDesc = 'Classic Gold & Dark Navy hanging ribbon badge';
    worshipMood = 'reverent worship atmosphere with soft warm lighting';
  }

  // 1. 클래식 타이틀형 (정석적이고 공식적인 16:9 썸네일)
  const thumbnail_style_1_prompt = `Create a 16:9 premium YouTube thumbnail for a Korean Christian sermon-song video for ${worshipType}.

[Style 1: Classic Title Layout]
Visual Composition:
- Top-Right Corner: A vertical hanging ribbon badge in ${ribbonDesc} with white text "${worshipType}".
- Top Header: Decorative ornamental line with crown motif and text "설교가 찬양이 되다".
- Center Main Title: "${songTitle}" in large, clean, bold Korean typography occupying about 60-70% of screen width. High contrast, clear, and easy to read.
- Bottom Subtitle: Decorative divider with text "| ${scripture} |".
- Background: A clean, peaceful church sanctuary interior with soft sunlight, wooden pulpit, and cross.
- Color Palette: ${paletteDesc}. Reverent, formal, clean, and premium.

Typography:
Bold, highly readable Korean title typography with strong contrast against the background for mobile users.`;

  // 2. 감성 묵상형 (충분한 여백, 따뜻한 묵상 감성)
  const thumbnail_style_2_prompt = `Create a 16:9 emotional YouTube thumbnail for a Korean Christian sermon-song video for ${worshipType}.

[Style 2: Meditative Grace Layout]
Visual Composition:
- Spacious & Artistic: Generous negative space, calm and uncluttered composition.
- Center Main Title: "${songTitle}" in elegant Korean serif calligraphy positioned comfortably in the center with plenty of breathing room.
- Minimal Text: Small subtitle text "${scripture}" positioned subtly below the main title. "설교가 찬양이 되다" is omitted or kept very small.
- Background: Warm gentle light streaming through church window onto an open Bible lying beside a simple wooden cross. Peaceful bokeh light particles.
- Mood: ${worshipMood}.
- Color Palette: ${paletteDesc}. Soft, warm, meditative, and graceful.

Typography:
Elegant Korean title text with subtle warm outline and spacious alignment.`;

  // 3. 벧엘교회 현장형 (벧엘교회 실제 내부 전경 유지)
  const thumbnail_style_3_prompt = `Create a 16:9 YouTube thumbnail for a Korean Christian sermon-song video for ${worshipType}.

[Style 3: Authentic Bethel Church Sanctuary Layout]
Visual Composition:
- Authentic Background: Based specifically on the real interior of Bethel Church in Korea featuring its iconic red brick altar wall, majestic white cylindrical side pillars, wooden pulpit, and golden wall cross.
- Preserved Structure: Maintain the actual architecture of Bethel Church with realistic warm sanctuary lighting and authentic church archive atmosphere.
- Text Overlay: Clear front center text layout. Top text "설교가 찬양이 되다", Center title "${songTitle}", Bottom scripture "${scripture}", and Top-Right worship badge "${worshipType}".
- Color Palette: Warm red brick, natural wood tones, white pillar accents, and soft ${paletteDesc}.

Typography:
Strong, clean Korean title typography, bold and distinct with solid outline for maximum clarity over the real church background.`;

  return {
    youtube_title: title,
    youtube_description: description,
    youtube_description_no_lyrics: description_no_lyrics,
    youtube_description_with_lyrics: description_with_lyrics,
    youtube_tags: tags,
    recommended_playlist: '설교가 찬양이 되다',
    thumbnail_text_top,
    thumbnail_text_main,
    thumbnail_text_bottom,
    thumbnail_label,
    thumbnail_style_1_prompt,
    thumbnail_style_2_prompt,
    thumbnail_style_3_prompt,
    thumbnail_prompt: thumbnail_style_1_prompt,
    thumbnail_prompts: [
      { style: 'classic', name: '1) 클래식 타이틀형', desc: '정돈된 공식 레이아웃 · 상단 라벨 + 중앙 타이틀(60~70%) + 하단 본문', prompt: thumbnail_style_1_prompt },
      { style: 'meditative', name: '2) 감성 묵상형', desc: '넉넉한 여백과 따뜻한 햇살 묵상감 · 성경책 & 십자가 감성 배경', prompt: thumbnail_style_2_prompt },
      { style: 'bethel', name: '3) 벧엘교회 현장형', desc: '벧엘교회 실제 내부 전경(붉은 벽돌, 흰 기둥, 강대상, 십자가) 기준', prompt: thumbnail_style_3_prompt }
    ]
  };
}
