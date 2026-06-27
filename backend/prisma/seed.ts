import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("Password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@construction.com" },
    update: {},
    create: {
      email: "demo@construction.com",
      password: hashedPassword,
      name: "John Manager",
      role: "MANAGER",
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: "Downtown Office Renovation",
      description: "Full interior renovation of 5-story office building",
      location: "123 Main St, London",
      budget: 250000,
      status: "ACTIVE",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-09-30"),
      ownerId: user.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Residential Complex Phase 1",
      description: "Foundation and framing for 3 residential buildings",
      location: "456 Oak Ave, Manchester",
      budget: 850000,
      status: "PLANNING",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2027-06-30"),
      ownerId: user.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Warehouse Extension",
      description: "Adding 10,000 sq ft logistics warehouse extension",
      location: "789 Industrial Blvd, Birmingham",
      budget: 420000,
      status: "ACTIVE",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-08-15"),
      ownerId: user.id,
    },
  });

  // Add costs
  await prisma.cost.createMany({
    data: [
      { category: "MATERIALS", description: "Steel beams", amount: 45000, projectId: project1.id },
      { category: "LABOR", description: "Foundation crew", amount: 12500, projectId: project1.id },
      { category: "EQUIPMENT", description: "Excavator rental", amount: 3200, quantity: 2, unit: "weeks", projectId: project1.id },
      { category: "MATERIALS", description: "Concrete delivery", amount: 28000, projectId: project2.id },
      { category: "LABOR", description: "Framing team", amount: 18000, projectId: project2.id },
      { category: "MATERIALS", description: "Roofing materials", amount: 55000, projectId: project3.id },
    ],
  });

  // Add daily logs
  await prisma.dailyLog.createMany({
    data: [
      { type: "PROGRESS", content: "Completed foundation pour for section A. Weather was clear, crew of 8 on site.", weather: "Clear, 18C", crewSize: 8, projectId: project1.id, authorId: user.id },
      { type: "SAFETY", content: "Safety inspection completed. All PPE in order. No incidents reported.", projectId: project1.id, authorId: user.id },
      { type: "PROGRESS", content: "Steel frame erection began on schedule. Crane arrived on time.", weather: "Partly cloudy, 16C", crewSize: 12, projectId: project3.id, authorId: user.id },
    ],
  });

  // Add subcontractors
  await prisma.subcontractor.createMany({
    data: [
      { companyName: "ABC Electrical Ltd", email: "info@abcelec.co.uk", phone: "020 7946 0958", city: "London", tradeCategories: "Electrical,Fire Alarm", insuranceProvider: "Aviva", status: "ACTIVE", riskLevel: "LOW", rating: 4.5 },
      { companyName: "XYZ Plumbing & Heating", email: "jobs@xyzplumbing.co.uk", phone: "0161 496 0321", city: "Manchester", tradeCategories: "Plumbing,HVAC,Gas", insuranceProvider: "AXA", status: "ACTIVE", riskLevel: "LOW", rating: 4.2 },
      { companyName: "SteelFrame Solutions", email: "contact@steelframe.co.uk", phone: "0121 496 0123", city: "Birmingham", tradeCategories: "Structural Steel,Cladding", insuranceProvider: "Allianz", status: "ACTIVE", riskLevel: "MEDIUM", rating: 3.8 },
    ],
  });

  // Add safety checklists
  await prisma.safetyChecklist.createMany({
    data: [
      { name: "Site Induction Checklist", items: JSON.stringify([{ id: 1, text: "PPE issued", checked: true }, { id: 2, text: "Emergency exits explained", checked: true }, { id: 3, text: "First aid location confirmed", checked: false }]), status: "IN_PROGRESS", projectId: project1.id },
      { name: "Weekly Safety Inspection", items: JSON.stringify([{ id: 1, text: "Scaffold inspection", checked: true }, { id: 2, text: "Fire extinguishers checked", checked: true }, { id: 3, text: "Walkways clear", checked: true }]), status: "COMPLETED", projectId: project1.id },
    ],
  });

  console.log("Seed complete!");
  console.log("Login: demo@construction.com / Password123");
  console.log("Projects: 3 | Costs: 6 | Logs: 3 | Subcontractors: 3");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
