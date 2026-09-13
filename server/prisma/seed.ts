import { PrismaClient, SubscriptionPlanStatus } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Electronics", slug: "electronics" },
  { name: "Tools", slug: "tools" },
  { name: "Vehicles", slug: "vehicles" },
  { name: "Events", slug: "events" },
  { name: "Home And Garden", slug: "home-and-garden" },
];

const plans = [
  {
    name: "Starter",
    description: "Development seed plan for small vendors.",
    monthlyPriceAmount: "19.00",
    yearlyPriceAmount: "190.00",
    maxProducts: 25,
    maxEmployees: 1,
    storageCapacityMb: 1024,
    maxActiveBookings: 10,
    hasPremiumFeatures: false,
    hasAnalytics: false,
  },
  {
    name: "Growth",
    description: "Development seed plan for growing vendors.",
    monthlyPriceAmount: "49.00",
    yearlyPriceAmount: "490.00",
    maxProducts: 150,
    maxEmployees: 5,
    storageCapacityMb: 10240,
    maxActiveBookings: 75,
    hasPremiumFeatures: true,
    hasAnalytics: true,
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        ...plan,
        status: SubscriptionPlanStatus.ACTIVE,
      },
      create: {
        ...plan,
        status: SubscriptionPlanStatus.ACTIVE,
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
