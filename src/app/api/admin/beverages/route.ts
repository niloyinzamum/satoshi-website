import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const beverages = await prisma.beverage.findMany();
  return NextResponse.json({ beverages });
}

export async function POST(request: Request) {
  const data = await request.json();
  const bev = await prisma.beverage.create({ 
    data: {
      ...data,
      price: Number(data.price)
    }
  });
  return NextResponse.json({ bev });
}
