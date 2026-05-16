import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 });

  const date = new Date(dateStr);
  date.setUTCHours(0,0,0,0);
  
  const deployment = await prisma.deployedMenu.findUnique({
    where: { date },
    include: { packages: true, beverages: true }
  });
  
  return NextResponse.json({ deployment });
}

export async function POST(request: Request) {
  const { date, packageIds, beverageIds } = await request.json();
  const targetDate = new Date(date);
  targetDate.setUTCHours(0,0,0,0);

  const existing = await prisma.deployedMenu.findUnique({ where: { date: targetDate } });
  if (existing) {
    await prisma.deployedMenu.delete({ where: { id: existing.id } });
  }

  const deployment = await prisma.deployedMenu.create({
    data: {
      date: targetDate,
      packages: {
        create: packageIds.map((id: string) => ({ package_id: id }))
      },
      beverages: {
        create: beverageIds.map((id: string) => ({ beverage_id: id }))
      }
    }
  });

  return NextResponse.json({ success: true, deployment });
}
