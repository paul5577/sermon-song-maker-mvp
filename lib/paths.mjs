import path from 'node:path';
import os from 'node:os';

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const ROOT = process.cwd();
export const DATA_DIR = isVercel ? path.join(os.tmpdir(), '.data') : path.join(ROOT, '.data');
export const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const WORK_DIR = path.join(DATA_DIR, 'work');
export const GENERATED_DIR = isVercel ? path.join(os.tmpdir(), 'generated') : path.join(ROOT, 'public', 'generated');
export const TEMPLATES_DIR = path.join(ROOT, 'public', 'templates');
