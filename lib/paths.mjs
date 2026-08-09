import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, '.data');
export const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const WORK_DIR = path.join(DATA_DIR, 'work');
export const GENERATED_DIR = path.join(ROOT, 'public', 'generated');
export const TEMPLATES_DIR = path.join(ROOT, 'public', 'templates');
