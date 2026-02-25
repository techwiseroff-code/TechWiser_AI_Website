import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'projects.json');

async function ensureDb() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error ensuring DB exists:', error);
  }
}

export async function GET() {
  await ensureDb();
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    let projects = JSON.parse(data);
    
    // Filter out expired projects (older than 24 hours)
    const now = new Date();
    const validProjects = projects.filter((p: any) => {
      const createdAt = new Date(p.createdAt);
      const diff = now.getTime() - createdAt.getTime();
      return diff < 24 * 60 * 60 * 1000;
    });

    // If we filtered anything, update the DB
    if (validProjects.length !== projects.length) {
      await fs.writeFile(DB_PATH, JSON.stringify(validProjects, null, 2));
    }

    return NextResponse.json(validProjects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await ensureDb();
  try {
    const project = await req.json();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const projects = JSON.parse(data);
    
    const newProject = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
    
    projects.unshift(newProject);
    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
    
    return NextResponse.json(newProject);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
