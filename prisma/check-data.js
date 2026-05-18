const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking SQLite Database Data ===");
  
  const breakfastItemCount = await prisma.breakfastItem.count();
  const packageCount = await prisma.package.count();
  const packageItemCount = await prisma.packageItem.count();
  const userCount = await prisma.user.count();
  const deployedMenuCount = await prisma.deployedMenu.count();
  const deployedPackageCount = await prisma.deployedPackage.count();
  const settings = await prisma.websiteSettings.findFirst();

  console.log(`- Breakfast Items: ${breakfastItemCount}`);
  console.log(`- Food Packages:   ${packageCount}`);
  console.log(`- Package Items:   ${packageItemCount} (Sides, Eggs, etc.)`);
  console.log(`- Deployed Menus:  ${deployedMenuCount} (35-day schedule)`);
  console.log(`- Deployed Pkgs:   ${deployedPackageCount}`);
  console.log(`- Users (Admin):   ${userCount}`);
  console.log(`- Active Settings: ${settings ? 'Default configured' : 'None'}`);
  
  console.log("\nSample Breakfast Items in DB:");
  const sampleItems = await prisma.breakfastItem.findMany({ take: 3 });
  sampleItems.forEach(item => console.log(`  * ${item.name} - ${item.price} BDT (Available: ${item.availability})`));

  console.log("\nSample Food Packages in DB:");
  const samplePkgs = await prisma.package.findMany({ take: 3 });
  samplePkgs.forEach(pkg => console.log(`  * ${pkg.title} - Base: ${pkg.base_price} BDT`));
  
  console.log("\nSeeded User Account:");
  const users = await prisma.user.findMany();
  users.forEach(u => console.log(`  * User Email: ${u.email}`));
  
  console.log("======================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
