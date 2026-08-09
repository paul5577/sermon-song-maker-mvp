import { retryProject } from '../../../../../lib/project-store.mjs';
export const runtime = 'nodejs';

export async function POST(_request, { params }) {
  const { id } = await params;
  const project = await retryProject(id);
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
  return Response.json({ project });
}
