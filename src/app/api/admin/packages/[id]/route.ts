import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const { title, base_price, optional_price, image_url, items } = data;
  
  await prisma.packageItem.deleteMany({ where: { package_id: params.id } });
  
  const pkg = await prisma.package.update({
    where: { id: params.id },
    data: {
      title, 
      base_price: Number(base_price), 
      optional_price: optional_price ? Number(optional_price) : null, 
      image_url,
      items: { 
        create: items.map((i: any) => ({
          name: i.name,
          portion: i.portion,
          calories: Number(i.calories),
          protein: Number(i.protein),
          carbs: Number(i.carbs),
          fiber: Number(i.fiber),
          fat: Number(i.fat),
          key_nutrients: i.key_nutrients
        }))
      }
    },
    include: { items: true }
  });
  return NextResponse.json({ pkg });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await prisma.package.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
