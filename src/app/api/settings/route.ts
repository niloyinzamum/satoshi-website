import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.websiteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const settings = await prisma.websiteSettings.update({
    where: { id: 'default' },
    data: {
      logo_text: body.logo_text,
      logo_url: body.logo_url,
      hero_text: body.hero_text,
    },
  });
  return NextResponse.json(settings);
}
