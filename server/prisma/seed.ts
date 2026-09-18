import { PrismaClient, SubscriptionPlanStatus } from "@prisma/client";

import { hashPassword } from "../src/utils/password.js";

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

const demoPasswords = {
  admin: "DemoAdmin2026!",
  vendor: "DemoVendor2026!",
  pendingVendor: "DemoPending2026!",
  customer: "DemoCustomer2026!",
};

const demoIds = {
  admin: "00000000-0000-4000-8000-000000000001",
  vendor: "00000000-0000-4000-8000-000000000002",
  pendingVendor: "00000000-0000-4000-8000-000000000003",
  customerOne: "00000000-0000-4000-8000-000000000011",
  customerTwo: "00000000-0000-4000-8000-000000000012",
  customerThree: "00000000-0000-4000-8000-000000000013",
  vendorProfile: "10000000-0000-4000-8000-000000000001",
  pendingVendorProfile: "10000000-0000-4000-8000-000000000002",
  subscription: "20000000-0000-4000-8000-000000000001",
  pendingSubscription: "20000000-0000-4000-8000-000000000002",
};

const productIds = [
  "30000000-0000-4000-8000-000000000001",
  "30000000-0000-4000-8000-000000000002",
  "30000000-0000-4000-8000-000000000003",
  "30000000-0000-4000-8000-000000000004",
  "30000000-0000-4000-8000-000000000005",
  "30000000-0000-4000-8000-000000000006",
  "30000000-0000-4000-8000-000000000007",
  "30000000-0000-4000-8000-000000000008",
  "30000000-0000-4000-8000-000000000009",
  "30000000-0000-4000-8000-000000000010",
] as const;

const imageFiles = [
  "camera.svg",
  "projector.svg",
  "power-drill.svg",
  "ladder.svg",
  "suv.svg",
  "cargo-bike.svg",
  "speaker.svg",
  "tent.svg",
  "espresso-machine.svg",
  "lawn-mower.svg",
];

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

function money(value: string) {
  return value;
}

function indexedUuid(prefix: string, index: number) {
  return `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

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

  const passwordHashes = {
    admin: await hashPassword(demoPasswords.admin),
    vendor: await hashPassword(demoPasswords.vendor),
    pendingVendor: await hashPassword(demoPasswords.pendingVendor),
    customer: await hashPassword(demoPasswords.customer),
  };

  const users = [
    {
      id: demoIds.admin,
      email: "admin.demo@i-share.local",
      passwordHash: passwordHashes.admin,
      role: "ADMIN" as const,
      firstName: "Amina",
      lastName: "Tesfaye",
      phoneNumber: "+251911000001",
    },
    {
      id: demoIds.vendor,
      email: "vendor.demo@i-share.local",
      passwordHash: passwordHashes.vendor,
      role: "VENDOR" as const,
      firstName: "Dawit",
      lastName: "Kebede",
      phoneNumber: "+251911000002",
    },
    {
      id: demoIds.pendingVendor,
      email: "pending.vendor.demo@i-share.local",
      passwordHash: passwordHashes.pendingVendor,
      role: "VENDOR" as const,
      firstName: "Marta",
      lastName: "Bekele",
      phoneNumber: "+251911000003",
    },
    {
      id: demoIds.customerOne,
      email: "customer.one.demo@i-share.local",
      passwordHash: passwordHashes.customer,
      role: "CUSTOMER" as const,
      firstName: "Liya",
      lastName: "Abebe",
      phoneNumber: "+251911000011",
    },
    {
      id: demoIds.customerTwo,
      email: "customer.two.demo@i-share.local",
      passwordHash: passwordHashes.customer,
      role: "CUSTOMER" as const,
      firstName: "Noah",
      lastName: "Morgan",
      phoneNumber: "+251911000012",
    },
    {
      id: demoIds.customerThree,
      email: "customer.three.demo@i-share.local",
      passwordHash: passwordHashes.customer,
      role: "CUSTOMER" as const,
      firstName: "Sara",
      lastName: "Hailu",
      phoneNumber: "+251911000013",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, emailVerifiedAt: new Date() },
      create: { ...user, emailVerifiedAt: new Date() },
    });
  }

  const customerProfiles = [
    [demoIds.customerOne, "Liya Abebe", "Ethiopia", "Addis Ababa", "+251911000011"],
    [demoIds.customerTwo, "Noah Morgan", "Kenya", "Nairobi", "+251911000012"],
    [demoIds.customerThree, "Sara Hailu", "Ethiopia", "Bahir Dar", "+251911000013"],
  ] as const;

  for (const [id, displayName, country, city, phoneNumber] of customerProfiles) {
    await prisma.customerProfile.upsert({
      where: { userId: id },
      update: { displayName, country, city, phoneNumber },
      create: { user: { connect: { id } }, displayName, country, city, phoneNumber },
    });
  }

  await prisma.vendorProfile.upsert({
    where: { userId: demoIds.vendor },
    update: {
      displayName: "Addis Gear Collective",
      businessName: "Addis Gear Collective PLC",
      businessEmail: "hello@addis-gear.example",
      businessPhone: "+251911100001",
      taxIdentifier: "DEMO-ET-1001",
      description: "Reliable equipment rentals for work, travel, and events.",
      websiteUrl: "https://example.com/addis-gear",
      country: "Ethiopia",
      city: "Addis Ababa",
      addressLine1: "Bole Road, Woreda 03",
      lifecycleStage: "APPROVED",
      verificationStatus: "APPROVED",
      status: "APPROVED",
      submittedAt: daysFromNow(-45),
      approvedAt: daysFromNow(-40),
      reviewedById: demoIds.admin,
    },
    create: {
      id: demoIds.vendorProfile,
      user: { connect: { id: demoIds.vendor } },
      displayName: "Addis Gear Collective",
      businessName: "Addis Gear Collective PLC",
      businessEmail: "hello@addis-gear.example",
      businessPhone: "+251911100001",
      taxIdentifier: "DEMO-ET-1001",
      description: "Reliable equipment rentals for work, travel, and events.",
      websiteUrl: "https://example.com/addis-gear",
      country: "Ethiopia",
      city: "Addis Ababa",
      addressLine1: "Bole Road, Woreda 03",
      lifecycleStage: "APPROVED",
      verificationStatus: "APPROVED",
      status: "APPROVED",
      submittedAt: daysFromNow(-45),
      approvedAt: daysFromNow(-40),
      reviewedBy: { connect: { id: demoIds.admin } },
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: demoIds.pendingVendor },
    update: {
      displayName: "North Star Rentals",
      businessName: "North Star Rentals",
      businessEmail: "hello@north-star.example",
      businessPhone: "+251911100002",
      country: "Ethiopia",
      city: "Hawassa",
      addressLine1: "Tabor Main Street",
      lifecycleStage: "PENDING_VERIFICATION",
      verificationStatus: "PENDING",
      status: "PENDING_VERIFICATION",
      submittedAt: daysFromNow(-2),
      approvedAt: null,
      reviewedById: null,
    },
    create: {
      id: demoIds.pendingVendorProfile,
      user: { connect: { id: demoIds.pendingVendor } },
      displayName: "North Star Rentals",
      businessName: "North Star Rentals",
      businessEmail: "hello@north-star.example",
      businessPhone: "+251911100002",
      country: "Ethiopia",
      city: "Hawassa",
      addressLine1: "Tabor Main Street",
      lifecycleStage: "PENDING_VERIFICATION",
      verificationStatus: "PENDING",
      status: "PENDING_VERIFICATION",
      submittedAt: daysFromNow(-2),
    },
  });

  const approvedVendor = await prisma.vendorProfile.findUniqueOrThrow({ where: { id: demoIds.vendorProfile } });
  const pendingVendor = await prisma.vendorProfile.findUniqueOrThrow({ where: { id: demoIds.pendingVendorProfile } });
  const starter = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { name: "Starter" } });
  const growth = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { name: "Growth" } });

  await prisma.vendorSubscription.upsert({
    where: { id: demoIds.subscription },
    update: { vendorId: approvedVendor.id, planId: growth.id, status: "ACTIVE", billingCycle: "YEARLY", startsAt: daysFromNow(-30), endsAt: daysFromNow(335), cancelledAt: null },
    create: { id: demoIds.subscription, vendorId: approvedVendor.id, planId: growth.id, status: "ACTIVE", billingCycle: "YEARLY", startsAt: daysFromNow(-30), endsAt: daysFromNow(335) },
  });
  await prisma.vendorSubscription.upsert({
    where: { id: demoIds.pendingSubscription },
    update: { vendorId: pendingVendor.id, planId: starter.id, status: "PENDING", billingCycle: "MONTHLY", startsAt: daysFromNow(7), endsAt: daysFromNow(37) },
    create: { id: demoIds.pendingSubscription, vendorId: pendingVendor.id, planId: starter.id, status: "PENDING", billingCycle: "MONTHLY", startsAt: daysFromNow(7), endsAt: daysFromNow(37) },
  });

  const categoryBySlug = Object.fromEntries(
    (await prisma.category.findMany({ where: { slug: { in: categories.map(({ slug }) => slug) } } })).map((category) => [category.slug, category]),
  );

  const products = [
    [productIds[0], demoIds.vendorProfile, "electronics", "Mirrorless Travel Camera", "A compact camera kit for travel stories, portraits, and small productions.", "DAILY", "38.00", "250.00", "Addis Ababa", "PUBLISHED"],
    [productIds[1], demoIds.vendorProfile, "electronics", "4K Event Projector", "Bright 4K projector with HDMI connectivity for presentations and movie nights.", "DAILY", "55.00", "300.00", "Addis Ababa", "PUBLISHED"],
    [productIds[2], demoIds.vendorProfile, "tools", "Professional Power Drill Kit", "Cordless drill and driver kit with two batteries and a full bit set.", "DAILY", "18.00", "100.00", "Addis Ababa", "PUBLISHED"],
    [productIds[3], demoIds.vendorProfile, "tools", "Heavy Duty Extension Ladder", "Stable aluminum extension ladder for painting, maintenance, and construction work.", "WEEKLY", "65.00", "180.00", "Adama", "PUBLISHED"],
    [productIds[4], demoIds.vendorProfile, "vehicles", "Weekend Adventure SUV", "Comfortable seven-seat SUV for weekend trips and family travel.", "DAILY", "95.00", "500.00", "Addis Ababa", "PUBLISHED"],
    [productIds[5], demoIds.vendorProfile, "vehicles", "Electric Cargo Bike", "Practical electric cargo bike for neighborhood deliveries and errands.", "HOURLY", "9.00", "120.00", "Addis Ababa", "PUBLISHED"],
    [productIds[6], demoIds.vendorProfile, "events", "Portable PA Speaker Set", "Two powered speakers, stands, microphones, and cables for small events.", "DAILY", "48.00", "200.00", "Addis Ababa", "UNPUBLISHED"],
    [productIds[7], demoIds.vendorProfile, "events", "Four Person Camping Tent", "Weather-resistant tent with a simple setup for weekend camping.", "WEEKLY", "42.00", "150.00", "Bahir Dar", "DRAFT"],
    [productIds[8], demoIds.pendingVendorProfile, "home-and-garden", "Commercial Espresso Machine", "Two-group espresso machine for pop-ups, cafes, and event service.", "DAILY", "75.00", "400.00", "Hawassa", "DRAFT"],
    [productIds[9], demoIds.pendingVendorProfile, "home-and-garden", "Quiet Electric Lawn Mower", "Battery-powered mower suited to small gardens and residential lawns.", "DAILY", "24.00", "90.00", "Hawassa", "DRAFT"],
  ] as const;

  for (const [id, vendorId, categorySlug, name, description, pricingModel, rate, deposit, city, status] of products) {
    const category = categoryBySlug[categorySlug];
    if (!category) throw new Error(`Missing seeded category: ${categorySlug}`);
    await prisma.product.upsert({
      where: { id },
      update: {
        vendorId, categoryId: category.id, name, description, pricingModel, dailyRate: pricingModel === "DAILY" ? money(rate) : null, hourlyRate: pricingModel === "HOURLY" ? money(rate) : null, weeklyRate: pricingModel === "WEEKLY" ? money(rate) : null, monthlyRate: null, securityDeposit: money(deposit), deliveryAvailable: [productIds[1], productIds[4], productIds[6]].includes(id), deliveryCharge: [productIds[1], productIds[4], productIds[6]].includes(id) ? money("15.00") : money("0"), city, country: "Ethiopia", specifications: { condition: "Excellent", included: ["Basic instructions", "Protective case"] }, rentalPolicies: { minimumNoticeHours: 24, identificationRequired: true, lateReturnPolicy: "Additional daily rate may apply." }, status, publishedAt: status === "PUBLISHED" ? daysFromNow(-20) : null, archivedAt: null,
      },
      create: {
        id, vendor: { connect: { id: vendorId } }, category: { connect: { id: category.id } }, name, slug: `demo-${id.slice(-4)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, description, pricingModel, dailyRate: pricingModel === "DAILY" ? money(rate) : null, hourlyRate: pricingModel === "HOURLY" ? money(rate) : null, weeklyRate: pricingModel === "WEEKLY" ? money(rate) : null, securityDeposit: money(deposit), deliveryAvailable: [productIds[1], productIds[4], productIds[6]].includes(id), deliveryCharge: [productIds[1], productIds[4], productIds[6]].includes(id) ? money("15.00") : money("0"), city, country: "Ethiopia", specifications: { condition: "Excellent", included: ["Basic instructions", "Protective case"] }, rentalPolicies: { minimumNoticeHours: 24, identificationRequired: true, lateReturnPolicy: "Additional daily rate may apply." }, status, publishedAt: status === "PUBLISHED" ? daysFromNow(-20) : null,
      },
    });
  }

  for (let index = 0; index < productIds.length; index += 1) {
    const productId = productIds[index];
    const imageFile = imageFiles[index];
    const imageId = indexedUuid("40000000", index + 1);
    await prisma.productImage.upsert({
      where: { id: imageId },
      update: { productId, fileName: imageFile, storageKey: `demo-images/${imageFile}`, url: `/demo-images/${imageFile}`, mimeType: "image/svg+xml", fileSize: 900, sortOrder: 0, altText: `Demo rental product image ${index + 1}`, visibility: "PUBLIC", metadata: { source: "local-demo-seed" } },
      create: { id: imageId, productId, fileName: imageFile, storageKey: `demo-images/${imageFile}`, url: `/demo-images/${imageFile}`, mimeType: "image/svg+xml", fileSize: 900, sortOrder: 0, altText: `Demo rental product image ${index + 1}`, visibility: "PUBLIC", metadata: { source: "local-demo-seed" } },
    });
  }

  const availabilityRows = productIds.flatMap((productId, index) => [
    { id: `50000000-0000-4000-8000-0000000000${String(index + 1).padStart(2, "0")}`, productId, type: "AVAILABLE" as const, startsAt: daysFromNow(-180), endsAt: daysFromNow(30), reason: "Regular rental availability" },
    ...(index < 6 ? [{ id: `50000000-0000-4000-8000-0000000001${String(index + 1).padStart(2, "0")}`, productId, type: "BLOCKED" as const, startsAt: daysFromNow(30), endsAt: daysFromNow(38), reason: "Reserved for vendor operations" }] : []),
    ...(index < 3 ? [{ id: `50000000-0000-4000-8000-0000000002${String(index + 1).padStart(2, "0")}`, productId, type: "MAINTENANCE" as const, startsAt: daysFromNow(38), endsAt: daysFromNow(42), reason: "Scheduled maintenance" }] : []),
  ]);
  for (const availability of availabilityRows) {
    await prisma.productAvailabilityPeriod.upsert({ where: { id: availability.id }, update: availability, create: availability });
  }

  const customerOne = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: demoIds.customerOne } });
  const customerTwo = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: demoIds.customerTwo } });
  const customerThree = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: demoIds.customerThree } });
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productIds[0] } });
  const productTwo = await prisma.product.findUniqueOrThrow({ where: { id: productIds[1] } });
  const productThree = await prisma.product.findUniqueOrThrow({ where: { id: productIds[2] } });
  const productFour = await prisma.product.findUniqueOrThrow({ where: { id: productIds[3] } });

  const bookingRows = [
    { id: "60000000-0000-4000-8000-000000000001", productId: product.id, customerId: customerOne.id, status: "PENDING" as const, startsAt: daysFromNow(8), endsAt: daysFromNow(10), duration: 2, unit: "38.00", subtotal: "76.00", delivery: "0.00", deposit: "250.00", total: "326.00" },
    { id: "60000000-0000-4000-8000-000000000002", productId: productTwo.id, customerId: customerTwo.id, status: "CONFIRMED" as const, startsAt: daysFromNow(12), endsAt: daysFromNow(14), duration: 2, unit: "55.00", subtotal: "110.00", delivery: "15.00", deposit: "300.00", total: "425.00" },
    { id: "60000000-0000-4000-8000-000000000003", productId: productThree.id, customerId: customerThree.id, status: "COMPLETED" as const, startsAt: daysFromNow(-70), endsAt: daysFromNow(-67), duration: 3, unit: "18.00", subtotal: "54.00", delivery: "0.00", deposit: "100.00", total: "154.00" },
    { id: "60000000-0000-4000-8000-000000000004", productId: productFour.id, customerId: customerOne.id, status: "REJECTED" as const, startsAt: daysFromNow(18), endsAt: daysFromNow(25), duration: 1, unit: "65.00", subtotal: "65.00", delivery: "0.00", deposit: "180.00", total: "245.00" },
    { id: "60000000-0000-4000-8000-000000000005", productId: product.id, customerId: customerTwo.id, status: "CANCELLED" as const, startsAt: daysFromNow(-25), endsAt: daysFromNow(-23), duration: 2, unit: "38.00", subtotal: "76.00", delivery: "0.00", deposit: "250.00", total: "326.00" },
    { id: "60000000-0000-4000-8000-000000000006", productId: productTwo.id, customerId: customerThree.id, status: "ACTIVE" as const, startsAt: daysFromNow(-1), endsAt: daysFromNow(2), duration: 3, unit: "55.00", subtotal: "165.00", delivery: "15.00", deposit: "300.00", total: "480.00" },
  ];
  for (const row of bookingRows) {
    await prisma.booking.upsert({
      where: { id: row.id },
      update: { productId: row.productId, vendorId: approvedVendor.id, customerId: row.customerId, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt, rentalDuration: row.duration, pricingModelSnapshot: row.productId === product.id ? "DAILY" : "DAILY", unitPriceSnapshot: money(row.unit), quantity: 1, rentalSubtotal: money(row.subtotal), deliveryCharge: money(row.delivery), securityDeposit: money(row.deposit), promotionalDiscount: money("0.00"), totalAmount: money(row.total), currency: "USD", cancellationReason: row.status === "CANCELLED" ? "Customer plans changed." : null, cancelledAt: row.status === "CANCELLED" ? daysFromNow(-24) : null, rejectedReason: row.status === "REJECTED" ? "The vehicle is unavailable for that period." : null, rejectedAt: row.status === "REJECTED" ? daysFromNow(-1) : null },
      create: { id: row.id, product: { connect: { id: row.productId } }, vendor: { connect: { id: approvedVendor.id } }, customer: { connect: { id: row.customerId } }, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt, rentalDuration: row.duration, pricingModelSnapshot: "DAILY", unitPriceSnapshot: money(row.unit), quantity: 1, rentalSubtotal: money(row.subtotal), deliveryCharge: money(row.delivery), securityDeposit: money(row.deposit), promotionalDiscount: money("0.00"), totalAmount: money(row.total), currency: "USD", cancellationReason: row.status === "CANCELLED" ? "Customer plans changed." : undefined, cancelledAt: row.status === "CANCELLED" ? daysFromNow(-24) : undefined, rejectedReason: row.status === "REJECTED" ? "The vehicle is unavailable for that period." : undefined, rejectedAt: row.status === "REJECTED" ? daysFromNow(-1) : undefined },
    });
  }

  const rentalRows = [
    { id: "70000000-0000-4000-8000-000000000002", bookingId: bookingRows[1].id, status: "CONFIRMED" as const, expectedReturnDate: bookingRows[1].endsAt },
    { id: "70000000-0000-4000-8000-000000000003", bookingId: bookingRows[2].id, status: "COMPLETED" as const, pickupDate: daysFromNow(-70), expectedReturnDate: daysFromNow(-67), actualReturnDate: daysFromNow(-66), isLateReturn: true, damageNotes: "Small scuff on the carrying case.", additionalCharges: money("12.00"), additionalChargeReason: "Case cleaning and repair" },
    { id: "70000000-0000-4000-8000-000000000006", bookingId: bookingRows[5].id, status: "IN_PROGRESS" as const, pickupDate: daysFromNow(-1), expectedReturnDate: bookingRows[5].endsAt },
  ];
  for (const rental of rentalRows) {
    await prisma.rental.upsert({ where: { id: rental.id }, update: rental, create: rental });
    for (const [eventIndex, eventType] of ["RENTAL_CREATED", "RENTAL_STARTED", ...(rental.status === "RETURNED" ? ["RENTAL_COMPLETED"] : [])].entries()) {
      const eventId = indexedUuid("71000000", Number(rental.id.slice(-2)) * 10 + eventIndex);
      await prisma.rentalEvent.upsert({ where: { id: eventId }, update: { rentalId: rental.id, recordedByUserId: demoIds.vendor, eventType, occurredAt: daysFromNow(-Math.max(1, 10 - eventIndex)), notes: `Demo event: ${eventType}`, metadata: { source: "local-demo-seed" } }, create: { id: eventId, rentalId: rental.id, recordedByUserId: demoIds.vendor, eventType, occurredAt: daysFromNow(-Math.max(1, 10 - eventIndex)), notes: `Demo event: ${eventType}`, metadata: { source: "local-demo-seed" } } });
    }
  }

  const paymentRows = [
    { id: "80000000-0000-4000-8000-000000000001", bookingId: bookingRows[1].id, provider: "BANK_TRANSFER" as const, status: "SUCCEEDED" as const, amount: "425.00", reference: "demo-booking-002-paid" },
    { id: "80000000-0000-4000-8000-000000000002", bookingId: bookingRows[0].id, provider: "CHAPA" as const, status: "PENDING" as const, amount: "326.00", reference: "demo-booking-001-pending" },
    { id: "80000000-0000-4000-8000-000000000003", bookingId: bookingRows[2].id, provider: "STRIPE" as const, status: "SUCCEEDED" as const, amount: "154.00", reference: "demo-booking-003-paid" },
    { id: "80000000-0000-4000-8000-000000000004", bookingId: bookingRows[3].id, provider: "PAYPAL" as const, status: "FAILED" as const, amount: "245.00", reference: "demo-booking-004-failed" },
    { id: "80000000-0000-4000-8000-000000000005", bookingId: bookingRows[4].id, provider: "TELEBIRR" as const, status: "CANCELLED" as const, amount: "326.00", reference: "demo-booking-005-cancelled" },
  ];
  for (const payment of paymentRows) {
    await prisma.payment.upsert({ where: { id: payment.id }, update: { bookingId: payment.bookingId, provider: payment.provider, methodLabel: "Demo payment", status: payment.status, amount: money(payment.amount), currency: "USD", providerReference: payment.reference, transactionId: payment.status === "SUCCEEDED" ? `txn-${payment.reference}` : null, paidAt: payment.status === "SUCCEEDED" ? daysFromNow(-5) : null, failureCode: payment.status === "FAILED" ? "DEMO_DECLINED" : null, failureMessage: payment.status === "FAILED" ? "Demo payment intentionally marked as failed." : null }, create: { id: payment.id, booking: { connect: { id: payment.bookingId } }, provider: payment.provider, methodLabel: "Demo payment", status: payment.status, amount: money(payment.amount), currency: "USD", providerReference: payment.reference, transactionId: payment.status === "SUCCEEDED" ? `txn-${payment.reference}` : undefined, paidAt: payment.status === "SUCCEEDED" ? daysFromNow(-5) : undefined, failureCode: payment.status === "FAILED" ? "DEMO_DECLINED" : undefined, failureMessage: payment.status === "FAILED" ? "Demo payment intentionally marked as failed." : undefined } });
  }

  const invoiceRows = [
    { id: "90000000-0000-4000-8000-000000000001", bookingId: bookingRows[1].id, paymentId: paymentRows[0].id, number: "DEMO-INV-0001", total: "425.00", subtotal: "425.00", customerId: customerTwo.id, productId: productTwo.id },
    { id: "90000000-0000-4000-8000-000000000002", bookingId: bookingRows[2].id, paymentId: paymentRows[2].id, number: "DEMO-INV-0002", total: "154.00", subtotal: "154.00", customerId: customerThree.id, productId: productThree.id },
  ];
  for (const invoice of invoiceRows) {
    const customer = users.find((user) => user.id === (invoice.customerId === customerTwo.id ? demoIds.customerTwo : demoIds.customerThree));
    await prisma.invoice.upsert({ where: { id: invoice.id }, update: { bookingId: invoice.bookingId, paymentId: invoice.paymentId, invoiceNumber: invoice.number, status: "PAID", issuedAt: daysFromNow(-5), paidAt: daysFromNow(-5), customerSnapshot: { displayName: customer?.firstName + " " + customer?.lastName, email: customer?.email }, vendorSnapshot: { displayName: approvedVendor.displayName, email: "hello@addis-gear.example" }, productSnapshot: { id: invoice.productId, name: invoice.productId === productTwo.id ? productTwo.name : productThree.name }, pricingSnapshot: { currency: "USD", total: invoice.total }, subtotalAmount: money(invoice.subtotal), discountAmount: money("0.00"), totalAmount: money(invoice.total), currency: "USD" }, create: { id: invoice.id, booking: { connect: { id: invoice.bookingId } }, payment: { connect: { id: invoice.paymentId } }, invoiceNumber: invoice.number, status: "PAID", issuedAt: daysFromNow(-5), paidAt: daysFromNow(-5), customerSnapshot: { displayName: customer?.firstName + " " + customer?.lastName, email: customer?.email }, vendorSnapshot: { displayName: approvedVendor.displayName, email: "hello@addis-gear.example" }, productSnapshot: { id: invoice.productId, name: invoice.productId === productTwo.id ? productTwo.name : productThree.name }, pricingSnapshot: { currency: "USD", total: invoice.total }, subtotalAmount: money(invoice.subtotal), discountAmount: money("0.00"), totalAmount: money(invoice.total), currency: "USD" } });
  }

  const reviewRows = [
    { id: "a0000000-0000-4000-8000-000000000001", rentalId: rentalRows[1].id, productId: productThree.id, customerId: customerThree.id, rating: 5, comment: "The drill was clean, powerful, and ready exactly on time." },
  ];
  for (const review of reviewRows) {
    await prisma.review.upsert({ where: { id: review.id }, update: { ...review, vendorId: approvedVendor.id, status: "PUBLISHED" }, create: { ...review, vendorId: approvedVendor.id, status: "PUBLISHED" } });
  }

  const notifications = [
    ["b0000000-0000-4000-8000-000000000001", demoIds.admin, "SYSTEM_ANNOUNCEMENT" as const, "Demo workspace ready", "The local demo dataset is available for testing.", "READ" as const],
    ["b0000000-0000-4000-8000-000000000002", demoIds.vendor, "BOOKING_REQUEST" as const, "New booking request", "Liya requested the Mirrorless Travel Camera.", "UNREAD" as const],
    ["b0000000-0000-4000-8000-000000000003", demoIds.vendor, "PAYMENT_CONFIRMATION" as const, "Payment received", "A demo payment was recorded for the 4K Event Projector.", "READ" as const],
    ["b0000000-0000-4000-8000-000000000004", demoIds.pendingVendor, "ACCOUNT_VERIFICATION" as const, "Verification is under review", "Your vendor application is waiting for administrator review.", "UNREAD" as const],
    ["b0000000-0000-4000-8000-000000000005", demoIds.customerOne, "BOOKING_APPROVAL" as const, "Booking request submitted", "Your camera booking is waiting for vendor confirmation.", "UNREAD" as const],
    ["b0000000-0000-4000-8000-000000000006", demoIds.customerTwo, "PAYMENT_CONFIRMATION" as const, "Payment confirmed", "Your projector payment has been recorded.", "READ" as const],
  ] as const;
  for (const [id, userId, type, title, body, status] of notifications) {
    await prisma.notification.upsert({ where: { id }, update: { userId, type, title, body, status, readAt: status === "READ" ? daysFromNow(-3) : null, payload: { source: "local-demo-seed" } }, create: { id, userId, type, title, body, status, readAt: status === "READ" ? daysFromNow(-3) : undefined, payload: { source: "local-demo-seed" } } });
  }

  const auditRows = [
    ["c0000000-0000-4000-8000-000000000001", demoIds.admin, "LOGIN" as const, "User", demoIds.admin, "Demo administrator signed in."],
    ["c0000000-0000-4000-8000-000000000002", demoIds.admin, "APPROVE" as const, "VendorProfile", demoIds.vendorProfile, "Approved demo vendor application."],
    ["c0000000-0000-4000-8000-000000000003", demoIds.vendor, "CREATE" as const, "Product", productIds[0], "Created demo camera listing."],
    ["c0000000-0000-4000-8000-000000000004", demoIds.vendor, "STATUS_CHANGE" as const, "Booking", bookingRows[1].id, "Confirmed demo booking."],
    ["c0000000-0000-4000-8000-000000000005", demoIds.vendor, "PAYMENT_EVENT" as const, "Payment", paymentRows[0].id, "Recorded successful demo payment."],
    ["c0000000-0000-4000-8000-000000000006", demoIds.vendor, "STATUS_CHANGE" as const, "Rental", rentalRows[1].id, "Completed demo rental."],
  ] as const;
  for (const [id, actorUserId, action, resourceType, resourceId, note] of auditRows) {
    await prisma.auditLog.upsert({ where: { id }, update: { actorUserId, action, resourceType, resourceId, metadata: { note, source: "local-demo-seed" }, ipAddress: "127.0.0.1", userAgent: "i-share-demo-seed" }, create: { id, actorUserId, action, resourceType, resourceId, metadata: { note, source: "local-demo-seed" }, ipAddress: "127.0.0.1", userAgent: "i-share-demo-seed" } });
  }

  await prisma.vendorDocument.upsert({ where: { id: "d0000000-0000-4000-8000-000000000001" }, update: { vendorId: approvedVendor.id, documentType: "BUSINESS_LICENSE", reviewStatus: "ACCEPTED", fileName: "addis-gear-business-license.pdf", storageKey: "demo-documents/addis-gear-business-license.pdf", url: null, mimeType: "application/pdf", fileSize: 24576, visibility: "PRIVATE", metadata: { source: "local-demo-seed" }, reviewedAt: daysFromNow(-40) }, create: { id: "d0000000-0000-4000-8000-000000000001", vendorId: approvedVendor.id, documentType: "BUSINESS_LICENSE", reviewStatus: "ACCEPTED", fileName: "addis-gear-business-license.pdf", storageKey: "demo-documents/addis-gear-business-license.pdf", mimeType: "application/pdf", fileSize: 24576, visibility: "PRIVATE", metadata: { source: "local-demo-seed" }, reviewedAt: daysFromNow(-40) } });
  await prisma.vendorDocument.upsert({ where: { id: "d0000000-0000-4000-8000-000000000002" }, update: { vendorId: pendingVendor.id, documentType: "BUSINESS_LICENSE", reviewStatus: "SUBMITTED", fileName: "north-star-business-license.pdf", storageKey: "demo-documents/north-star-business-license.pdf", url: null, mimeType: "application/pdf", fileSize: 18432, visibility: "PRIVATE", metadata: { source: "local-demo-seed" }, reviewedAt: null }, create: { id: "d0000000-0000-4000-8000-000000000002", vendorId: pendingVendor.id, documentType: "BUSINESS_LICENSE", reviewStatus: "SUBMITTED", fileName: "north-star-business-license.pdf", storageKey: "demo-documents/north-star-business-license.pdf", mimeType: "application/pdf", fileSize: 18432, visibility: "PRIVATE", metadata: { source: "local-demo-seed" } } });

  await prisma.dispute.upsert({ where: { id: "e0000000-0000-4000-8000-000000000001" }, update: { bookingId: bookingRows[2].id, openedByUserId: demoIds.customerThree, reason: "Minor equipment damage", description: "A small case scuff was reported after return.", status: "UNDER_REVIEW" }, create: { id: "e0000000-0000-4000-8000-000000000001", bookingId: bookingRows[2].id, openedByUserId: demoIds.customerThree, reason: "Minor equipment damage", description: "A small case scuff was reported after return.", status: "UNDER_REVIEW" } });
  await prisma.damageReport.upsert({ where: { id: "f0000000-0000-4000-8000-000000000001" }, update: { rentalId: rentalRows[1].id, description: "Small scuff on the carrying case.", charge: money("12.00"), evidence: { photos: ["demo-evidence/case-scuff-1.svg"] }, status: "REVIEWING" }, create: { id: "f0000000-0000-4000-8000-000000000001", rentalId: rentalRows[1].id, description: "Small scuff on the carrying case.", charge: money("12.00"), evidence: { photos: ["demo-evidence/case-scuff-1.svg"] }, status: "REVIEWING" } });

  const counts = await Promise.all([
    prisma.user.count({ where: { id: { in: users.map(({ id }) => id) } } }),
    prisma.vendorProfile.count({ where: { id: { in: [demoIds.vendorProfile, demoIds.pendingVendorProfile] } } }),
    prisma.customerProfile.count({ where: { userId: { in: [demoIds.customerOne, demoIds.customerTwo, demoIds.customerThree] } } }),
    prisma.product.count({ where: { id: { in: [...productIds] } } }),
    prisma.productImage.count({ where: { productId: { in: [...productIds] } } }),
    prisma.productAvailabilityPeriod.count({ where: { productId: { in: [...productIds] } } }),
    prisma.booking.count({ where: { id: { in: bookingRows.map(({ id }) => id) } } }),
    prisma.rental.count({ where: { id: { in: rentalRows.map(({ id }) => id) } } }),
    prisma.payment.count({ where: { id: { in: paymentRows.map(({ id }) => id) } } }),
    prisma.invoice.count({ where: { id: { in: invoiceRows.map(({ id }) => id) } } }),
    prisma.review.count({ where: { id: { in: reviewRows.map(({ id }) => id) } } }),
    prisma.notification.count({ where: { id: { in: notifications.map(([id]) => id) } } }),
    prisma.auditLog.count({ where: { id: { in: auditRows.map(([id]) => id) } } }),
  ]);

  console.log("Demo seed completed.");
  console.log(`Users: ${counts[0]}`);
  console.log(`Vendors: ${counts[1]}`);
  console.log(`Customers: ${counts[2]}`);
  console.log(`Products: ${counts[3]}`);
  console.log(`Images: ${counts[4]}`);
  console.log(`Availability periods: ${counts[5]}`);
  console.log(`Bookings: ${counts[6]}`);
  console.log(`Rentals: ${counts[7]}`);
  console.log(`Payments: ${counts[8]}`);
  console.log(`Invoices: ${counts[9]}`);
  console.log(`Reviews: ${counts[10]}`);
  console.log(`Notifications: ${counts[11]}`);
  console.log(`Audit logs: ${counts[12]}`);
  console.log("Demo accounts (local development only):");
  console.log(`Admin: admin.demo@i-share.local / ${demoPasswords.admin}`);
  console.log(`Approved vendor: vendor.demo@i-share.local / ${demoPasswords.vendor}`);
  console.log(`Pending vendor: pending.vendor.demo@i-share.local / ${demoPasswords.pendingVendor}`);
  console.log(`Customers: customer.one.demo@i-share.local, customer.two.demo@i-share.local, customer.three.demo@i-share.local / ${demoPasswords.customer}`);
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
