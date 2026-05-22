import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const userName = request.headers.get('x-user-name') || 'Someone';
    const userRole = request.headers.get('x-user-role') || 'user';
    
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
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

    // Helper functions for logging activity
    const formatDate = (dateStr) => {
      if (!dateStr) return 'none';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const hasDateChanged = (d1, d2) => {
      if (!d1 && !d2) return false;
      if (!d1 || !d2) return true;
      return new Date(d1).getTime() !== new Date(d2).getTime();
    };

    const activitiesToCreate = [];

    // 1. Status changes
    if (existingProject.status !== data.status) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `updated the status of project "${project.title}" to "${data.status}"`
      });
    }

    // 2. Owner changes (added / removed)
    const oldOwners = existingProject.owner ? existingProject.owner.split(', ').map(o => o.trim()).filter(Boolean) : [];
    const newOwners = data.owner ? data.owner.split(', ').map(o => o.trim()).filter(Boolean) : [];
    
    const addedOwners = newOwners.filter(o => !oldOwners.includes(o));
    const removedOwners = oldOwners.filter(o => !newOwners.includes(o));

    addedOwners.forEach(ownerName => {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `added "${ownerName}" to the project "${project.title}"`
      });
    });

    removedOwners.forEach(ownerName => {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `removed "${ownerName}" from the project "${project.title}"`
      });
    });

    // 3. Date changes
    if (hasDateChanged(existingProject.startDate, data.startDate)) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the start date of project "${project.title}" to "${formatDate(data.startDate)}"`
      });
    }
    if (hasDateChanged(existingProject.endDate, data.endDate)) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the target end date of project "${project.title}" to "${formatDate(data.endDate)}"`
      });
    }
    if (hasDateChanged(existingProject.uatDate, data.uatDate)) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the UAT date of project "${project.title}" to "${formatDate(data.uatDate)}"`
      });
    }
    if (hasDateChanged(existingProject.prodDate, data.prodDate)) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the production date of project "${project.title}" to "${formatDate(data.prodDate)}"`
      });
    }

    // 4. Progress changes
    const oldProgress = existingProject.progress ?? 0;
    const newProgress = data.progress !== undefined ? parseInt(data.progress) : oldProgress;
    if (oldProgress !== newProgress) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `updated the progress of project "${project.title}" to ${newProgress}%`
      });
    }

    // 5. Priority changes
    if (data.priority !== undefined && existingProject.priority !== data.priority) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the priority of project "${project.title}" to "${data.priority}"`
      });
    }

    // 6. Health changes
    if (data.health !== undefined && existingProject.health !== data.health) {
      activitiesToCreate.push({
        userName,
        userRole,
        actionType: 'UPDATE',
        details: `changed the health of project "${project.title}" to "${data.health}"`
      });
    }

    // Create all activities in database
    if (activitiesToCreate.length > 0) {
      await prisma.activity.createMany({
        data: activitiesToCreate
      });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    const userName = request.headers.get('x-user-name') || 'Someone';
    const userRole = request.headers.get('x-user-role') || 'user';

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id }
    });

    // Log deletion activity
    await prisma.activity.create({
      data: {
        userName,
        userRole,
        actionType: 'DELETE',
        details: `deleted the project "${project.title}"`
      }
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
