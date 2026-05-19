import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      select: { owner: true }
    });

    const ownersSet = new Set();
    
    projects.forEach(project => {
      if (project.owner) {
        // Split by comma in case multiple people are assigned
        const names = project.owner.split(',').map(name => name.trim()).filter(name => name !== '');
        names.forEach(name => ownersSet.add(name));
      }
    });

    const uniqueOwners = Array.from(ownersSet).sort();

    return NextResponse.json(uniqueOwners);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 });
  }
}
