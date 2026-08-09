export const TEMPLATES = {
  'gold': {
    id: 'gold',
    template_key: 'gold',
    template_name: '주일예배 · Gold',
    worship_type: '주일예배',
    folder: 'gold',
    color_accent: '0xf4e2b6',
    color_primary: '0x1a2b4c',
    color_text: '0xffffff',
    description: '대표예배, 정돈, 은혜',
    outro_message: '오늘 들은 말씀이\n이번 한 주의 삶이 되기를\n기도합니다.'
  },
  'blue': {
    id: 'blue',
    template_key: 'blue',
    template_name: '수요기도회 · Blue',
    worship_type: '수요기도회',
    folder: 'blue',
    color_accent: '0x88c0f0',
    color_primary: '0x0f1d33',
    color_text: '0xffffff',
    description: '말씀강해, 묵상, 차분함',
    outro_message: '오늘 주신 말씀이\n삶 속에서 깊이 묵상되기를\n기도합니다.'
  },
  'burgundy': {
    id: 'burgundy',
    template_key: 'burgundy',
    template_name: '금요기도회 · Burgundy',
    worship_type: '금요기도회',
    folder: 'burgundy',
    color_accent: '0xe8a4c8',
    color_primary: '0x2d121e',
    color_text: '0xffffff',
    description: '기도, 회복, 깊은 예배',
    outro_message: '오늘 들은 말씀이\n이번 한 주의 삶이 되기를\n기도합니다.'
  },
  'navy-gold': {
    id: 'navy-gold',
    template_key: 'navy-gold',
    template_name: '기본형 · Deep Navy + Gold',
    worship_type: '기타',
    folder: 'navy',
    color_accent: '0xe7d7a6',
    color_primary: '0x0d1b2a',
    color_text: '0xffffff',
    description: '특별·부서·기타 예배',
    outro_message: '함께해 주셔서 감사합니다.\n오늘의 은혜가\n삶 속에 이어지기를 기도합니다.'
  }
};

export const DEFAULT_TEMPLATE_ID = 'gold';

export function getDefaultTemplateId(worshipType) {
  switch (worshipType) {
    case '주일예배':
      return 'gold';
    case '수요기도회':
      return 'blue';
    case '금요기도회':
      return 'burgundy';
    default:
      return 'navy-gold';
  }
}

export function getTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES[DEFAULT_TEMPLATE_ID];
}
