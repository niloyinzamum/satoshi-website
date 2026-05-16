import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const packages = await prisma.package.findMany({ include: { items: true } });
  return NextResponse.json({ packages });
}

export async function POST(request: Request) {
  const data = await request.json();
  const { title, base_price, optional_price, image_url, items } = data;
  const pkg = await prisma.package.create({
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
