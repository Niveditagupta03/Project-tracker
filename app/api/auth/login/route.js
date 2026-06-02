import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Check if the User table is empty (auto-seed first administrator)
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      // Auto-create default admin account (Pradeep)
      const { salt, hash } = hashPassword('password123');
      await prisma.user.create({
        data: {
          username: 'pradeep',
          passwordHash: hash,
          salt: salt,
          name: 'Pradeep',
          role: 'admin'
        }
      });
    }

    // Look up the user
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordCorrect = verifyPassword(password, user.salt, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Choose avatar style based on role
    const avatarUrl = user.role === 'admin'
      ? `https://ui-avatars.com/api/?name=Admin&background=6366F1&color=ffffff&bold=true`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=E2E8F0&color=475569&bold=true`;

    // Return session data
    return NextResponse.json({
      name: user.name,
      role: user.role,
      avatarUrl
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during authentication' }, { status: 500 });
  }
}
