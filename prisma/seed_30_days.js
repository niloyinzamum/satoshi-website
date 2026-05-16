const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.package.findMany();
  const beverages = await prisma.beverage.findMany();

  if (packages.length === 0) {
    console.log("No packages found. Seed catalog first.");
    return;
  }

  const pkgId = packages[0].id;
  const bevId = beverages.length > 0 ? beverages[0].id : null;

  const today = new Date();
  today.setUTCHours(0,0,0,0);

  for (let i = 1; i <= 35; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    // Skip Fridays (5 in JS getDay())
    if (targetDate.getDay() === 5) continue;

    const existing = await prisma.deployedMenu.findUnique({ where: { date: targetDate } });
    if (existing) {
      await prisma.deployedMenu.delete({ where: { id: existing.id } });
    }

    await prisma.deployedMenu.create({
      data: {
        date: targetDate,
        packages: {
          create: [{ package_id: pkgId }]
        },
        beverages: bevId ? {
          create: [{ beverage_id: bevId }]
        } : undefined
      }
    });
  }
  console.log("Seeded deployments for the next 35 days.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
