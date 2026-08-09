import { getProject } from '../../../../lib/project-store.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
  return Response.json({ project });
}
