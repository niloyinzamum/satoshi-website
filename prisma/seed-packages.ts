import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_IMAGE = '/uploads/default-food.png';
const BASE_PRICE = 484;
const OPTIONAL_PRICE = 499;

const sides = [
  { name: 'Sauted Veg', portion: '~300g', calories: 220, protein: 8, carbs: 25, fiber: 8, fat: 14, key_nutrients: 'VitC-VitK-K-Mg-AOX' },
  { name: 'Fruit Salad', portion: '~200g', calories: 120, protein: 2, carbs: 30, fiber: 4, fat: 0, key_nutrients: 'VitC-K-AOX' },
  { name: 'Nuts/Dates', portion: '~40g', calories: 220, protein: 5, carbs: 20, fiber: 3, fat: 14, key_nutrients: 'VitE-Mg-Fe-AOX' },
];

const egg = { name: 'Omega 3 Egg', portion: '1 Large', calories: 70, protein: 6, carbs: 1, fiber: 0, fat: 5, key_nutrients: 'B12-Choline-Protein' };

const packages = [
  {
    title: 'Aglio Olio (Classic)',
    main: { name: 'Aglio Olio', portion: '~250g', calories: 320, protein: 6, carbs: 45, fiber: 3, fat: 12, key_nutrients: 'Energy, Healthy Fats' }
  },
  {
    title: 'Rice Paper Noodles',
    main: { name: 'Rice Noodles', portion: '~250g', calories: 300, protein: 5, carbs: 70, fiber: 2, fat: 1, key_nutrients: 'Energy' }
  },
  {
    title: 'Chicken Salad Sandwich',
    main: { name: 'Chicken Sandw.', portion: '1 Full', calories: 350, protein: 22, carbs: 35, fiber: 5, fat: 10, key_nutrients: 'Lean Protein, Fiber' }
  },
  {
    title: 'Peanut Butter & Banana Toast',
    main: { name: 'PB & Banana', portion: '2 Slices', calories: 380, protein: 12, carbs: 48, fiber: 7, fat: 16, key_nutrients: 'Potassium, Energy' }
  },
  {
    title: 'Egg & Cheese Melt',
    main: { name: 'Cheese Melt', portion: '1 Unit', calories: 340, protein: 14, carbs: 30, fiber: 3, fat: 18, key_nutrients: 'Calcium, Protein' }
  },
  {
    title: 'Tomato Basil Pasta',
    main: { name: 'Basil Pasta', portion: '~250g', calories: 310, protein: 9, carbs: 55, fiber: 5, fat: 6, key_nutrients: 'Lycopene, Antioxidants' }
  },
  {
    title: 'Savory French Toast',
    main: { name: 'Savory Toast', portion: '2 Slices', calories: 300, protein: 11, carbs: 38, fiber: 4, fat: 12, key_nutrients: 'Herb-rich, Energy' }
  },
  {
    title: 'Vegetable Chow Mein',
    main: { name: 'Chow Mein', portion: '~250g', calories: 280, protein: 7, carbs: 50, fiber: 6, fat: 8, key_nutrients: 'Fiber, VitA' }
  },
  {
    title: 'Herb-Omelet Wrap',
    main: { name: 'Omelet Wrap', portion: '1 Unit', calories: 260, protein: 18, carbs: 15, fiber: 2, fat: 14, key_nutrients: 'High Protein' }
  },
  {
    title: 'Tuna & Cucumber Sandwich',
    main: { name: 'Tuna Sandw.', portion: '1 Full', calories: 320, protein: 25, carbs: 32, fiber: 4, fat: 8, key_nutrients: 'Omega-3, Chilled Fresh' }
  },
  {
    title: 'Spicy Aglio Olio',
    main: { name: 'Spicy Aglio', portion: '~250g', calories: 330, protein: 6, carbs: 45, fiber: 3, fat: 14, key_nutrients: 'Metabolism Boost' }
  },
  {
    title: 'Ginger Rice Noodles',
    main: { name: 'Ginger Noodles', portion: '~250g', calories: 305, protein: 5, carbs: 72, fiber: 2, fat: 2, key_nutrients: 'Digestion, Energy' }
  }
];

async function main() {
  console.log('Starting seed...');
  
  for (const pkgData of packages) {
    const createdPkg = await prisma.package.create({
      data: {
        title: pkgData.title,
        base_price: BASE_PRICE,
        optional_price: OPTIONAL_PRICE,
        image_url: DEFAULT_IMAGE,
        items: {
          create: [
            pkgData.main,
            ...sides,
            egg
          ]
        }
      }
    });
    console.log(`Created package: ${createdPkg.title}`);
  }
  
  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
