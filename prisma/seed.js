const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.breakfastItem.createMany({
    data: [
      {
        name: 'Avocado Toast',
        price: 8.50,
        image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=200&auto=format&fit=crop',
        availability: true,
      },
      {
        name: 'Pancakes & Syrup',
        price: 10.00,
        image_url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=200&auto=format&fit=crop',
        availability: true,
      },
      {
        name: 'Full English Breakfast',
        price: 14.50,
        image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=200&auto=format&fit=crop',
        availability: true,
      },
      {
        name: 'Acai Bowl',
        price: 12.00,
        image_url: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?q=80&w=200&auto=format&fit=crop',
        availability: false,
      }
    ],
  });
  console.log('Database seeded with breakfast items.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
