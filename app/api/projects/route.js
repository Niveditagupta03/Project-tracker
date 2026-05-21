import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter conditions
    const andConditions = [];

    if (owner) {
      andConditions.push({ owner: { contains: owner, mode: 'insensitive' } });
    }
    if (status) {
      andConditions.push({ status: status });
    }
    if (startDate) {
      andConditions.push({ startDate: { gte: new Date(startDate) } });
    }
    if (endDate) {
      andConditions.push({ endDate: { lte: new Date(endDate) } });
    }
    
    if (search) {
      const searchWords = search.split(/\s+/).filter(word => word.length > 0);
      
      searchWords.forEach(word => {
        andConditions.push({
          OR: [
            { title: { contains: word, mode: 'insensitive' } },
            { owner: { contains: word, mode: 'insensitive' } },
            { description: { contains: word, mode: 'insensitive' } },
            { type: { contains: word, mode: 'insensitive' } },
            { comments: { contains: word, mode: 'insensitive' } },
            { status: { contains: word, mode: 'insensitive' } },
          ],
        });
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Debug log to see the query in the server console
    console.log('Fetching projects with where:', JSON.stringify(where, null, 2));

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const project = await prisma.project.create({
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
        progress: data.progress ? parseInt(data.progress) : 0,
        priority: data.priority || 'Medium',
        health: data.health || 'On Track',
      }
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
