import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { id, items, total_price, customer_name, phone, flat, house, road, area, delivery_fee } = await req.json();

    const order = await prisma.order.create({
      data: {
        id,
        items: JSON.stringify(items),
        total_price,
        customer_name,
        phone,
        flat,
        house,
        road,
        area,
        delivery_fee,
        status: 'AWAITING_PAYMENT',
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
