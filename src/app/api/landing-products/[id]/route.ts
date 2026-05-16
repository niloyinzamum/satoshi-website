import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const product = await prisma.landingProduct.update({
    where: { id: params.id },
    data: {
      name: body.name,
      price: body.price,
      image_url: body.image_url,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.landingProduct.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}
