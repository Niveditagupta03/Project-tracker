import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        owner: data.owner,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        uatDate: data.uatDate ? new Date(data.uatDate) : null,
        prodDate: data.prodDate ? new Date(data.prodDate) : null,
        dependencyWith: data.dependencyWith,
        comments: data.comments,
        progress: data.progress !== undefined ? parseInt(data.progress) : undefined,
        priority: data.priority,
        health: data.health,
      }
    });
    
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    await prisma.project.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
