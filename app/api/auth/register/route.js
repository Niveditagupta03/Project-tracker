import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password, name, role } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, and name are required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const finalName = name.trim();
    const finalRole = role === 'admin' ? 'admin' : 'reportee';

    if (normalizedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Hash password and store user
    const { salt, hash } = hashPassword(password);
    
    await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash: hash,
        salt: salt,
        name: finalName,
        role: finalRole
      }
    });

    return NextResponse.json({ success: true, message: 'User registered successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 });
  }
}
