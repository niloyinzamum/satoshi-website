import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const bev = await prisma.beverage.update({ 
    where: { id: params.id }, 
    data: {
      ...data,
      price: Number(data.price)
    } 
  });
  return NextResponse.json({ bev });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await prisma.beverage.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
