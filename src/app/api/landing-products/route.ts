import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.landingProduct.findMany({
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const product = await prisma.landingProduct.create({
    data: {
      name: body.name,
      price: Float64Array.from([body.price])[0], // Ensure float
      image_url: body.image_url,
    },
  });
  return NextResponse.json(product);
}
