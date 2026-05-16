import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const deployments = await prisma.deployedMenu.findMany({
      where: { date: { gte: today } },
      orderBy: { date: 'asc' },
      include: {
        packages: {
          include: {
            package: { include: { items: true } }
          }
        },
        beverages: {
          include: { beverage: true }
        }
      }
    });

    return NextResponse.json({ deployments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}
