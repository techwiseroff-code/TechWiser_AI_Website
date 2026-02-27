import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'projects.json');

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let projects = [];
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      projects = data ? JSON.parse(data) : [];
    } catch {
      projects = [];
    }

    projects = projects.filter((p: any) => p.id !== id);
    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    let projects = [];
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      projects = data ? JSON.parse(data) : [];
    } catch {
      projects = [];
    }

    const index = projects.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    projects[index] = { ...projects[index], ...updates };
    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));

    return NextResponse.json(projects[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
