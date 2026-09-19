import { PrismaClient, BranchName, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Branches
  const branches = [
    { name: BranchName.AL_BARSHA, label: "Al Barsha", address: "Barsha Heights (Tecom)" },
    { name: BranchName.AL_RASHIDIYA, label: "Al Rashidiya", address: "Rashidiya Dubai" },
    { name: BranchName.ABU_HAIL, label: "Al-Hamriya", address: "Deira Dubai" },
    { name: BranchName.AL_NAHDA, label: "Al Nahda", address: "Al Nahda-2 Dubai" },
  ];

  const branchRecords: Record<string, string> = {};

  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { name: b.name },
      update: { label: b.label, address: b.address },
      create: { name: b.name, label: b.label, address: b.address },
    });
    branchRecords[b.name] = branch.id;
    console.log(`✓ Branch: ${b.label} (${branch.id})`);
  }

  // 2. Seed SuperAdmin (from .env)
  const adminUsername = process.env.ADMIN_USERNAME || process.env.SUPERADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD;
  const adminName = process.env.SUPERADMIN_NAME || process.env.ADMIN_NAME || "Administrator";

  if (!adminUsername || !adminPassword) {
    throw new Error(
      "SECURITY ERROR: Missing ADMIN_USERNAME or ADMIN_PASSWORD in your .env file. Please define them before running database seed."
    );
  }

  const cleanUsername = adminUsername.trim()

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.staff.upsert({
    where: { username: cleanUsername },
    update: {
      passwordHash: adminPasswordHash,
      role: StaffRole.SUPER_ADMIN,
      name: adminName,
    },
    create: {
      username: cleanUsername,
      passwordHash: adminPasswordHash,
      role: StaffRole.SUPER_ADMIN,
      name: adminName,
      branchId: null,
    },
  });
  console.log(`✓ SuperAdmin created/updated: ${admin.username}`);

  // 4. Seed ChallengeSettings
  const now = new Date();
  const regStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const regEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);   // 14 days ahead
  const finalizeDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days ahead

  await prisma.challengeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      registrationStart: regStart,
      registrationEnd: regEnd,
      finalizeDate: finalizeDate,
      rulesText: `GYM WEIGHT LOSS CHALLENGE — OFFICIAL RULES
1. This is an official 30-day challenge starting from your Day-1 weigh-in at any branch.
2. All participants must return to any branch on 30th day of their Day-1 date for the final weigh-in.
3. Failure to return on 30th day results in automatic disqualification.
4. Winners are determined strictly by total kilograms lost (Day-1 weight minus Final weight).
5. Management's decision on final results is final and binding.
6. By signing, you confirm the recorded weights are accurate and agree to these terms.`,
    },
  });
  console.log("✓ Challenge Settings initialized (Registration open).");

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
