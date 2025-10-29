import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { domains, jobRoles, adminUsers, courses, pathways, courseJobRoles } from "./drizzle/schema";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create Domains
  console.log("Creating domains...");
  const domainData = await db.insert(domains).values([
    {
      name: "Software Engineering",
      description: "Full-stack development, backend, frontend, and DevOps training",
      isActive: 1,
      createdBy: "system",
    },
    {
      name: "Cybersecurity",
      description: "Network security, ethical hacking, and security operations",
      isActive: 1,
      createdBy: "system",
    },
    {
      name: "Data Science & Analytics",
      description: "Data analysis, machine learning, and business intelligence",
      isActive: 1,
      createdBy: "system",
    },
    {
      name: "IT Support",
      description: "Technical support, help desk, and system administration",
      isActive: 1,
      createdBy: "system",
    },
  ]).returning();
  console.log(`✅ Created ${domainData.length} domains`);

  // 2. Create Job Roles
  console.log("Creating job roles...");
  const jobRoleData = await db.insert(jobRoles).values([
    {
      title: "IT Support Specialist",
      description: "Provide technical support and troubleshooting for end users",
      salaryRange: "45,000 - 65,000",
      isActive: 1,
    },
    {
      title: "Help Desk Technician",
      description: "First-line support for IT issues and user assistance",
      salaryRange: "40,000 - 55,000",
      isActive: 1,
    },
    {
      title: "Network Administrator",
      description: "Manage and maintain network infrastructure",
      salaryRange: "60,000 - 85,000",
      isActive: 1,
    },
    {
      title: "Network Engineer",
      description: "Design and implement network solutions",
      salaryRange: "75,000 - 110,000",
      isActive: 1,
    },
    {
      title: "Cybersecurity Analyst",
      description: "Monitor and protect systems from security threats",
      salaryRange: "70,000 - 100,000",
      isActive: 1,
    },
    {
      title: "Ethical Hacker",
      description: "Test and identify security vulnerabilities",
      salaryRange: "80,000 - 120,000",
      isActive: 1,
    },
    {
      title: "Full Stack Developer",
      description: "Develop both frontend and backend applications",
      salaryRange: "75,000 - 120,000",
      isActive: 1,
    },
    {
      title: "Software Engineer",
      description: "Design, develop, and maintain software applications",
      salaryRange: "80,000 - 130,000",
      isActive: 1,
    },
    {
      title: "Data Analyst",
      description: "Analyze data to provide business insights",
      salaryRange: "60,000 - 90,000",
      isActive: 1,
    },
    {
      title: "Data Scientist",
      description: "Build predictive models and machine learning solutions",
      salaryRange: "90,000 - 140,000",
      isActive: 1,
    },
  ]).returning();
  console.log(`✅ Created ${jobRoleData.length} job roles`);

  // 3. Create Admin User
  console.log("Creating admin user...");
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const adminData = await db.insert(adminUsers).values({
    username: "admin",
    email: "admin@perscholas.org",
    passwordHash: passwordHash,
    role: "global_admin",
    isFirstLogin: 0,
    createdBy: "system",
  }).returning();
  console.log(`✅ Created admin user: admin / Admin123!`);

  // 4. Create Sample Courses
  console.log("Creating sample courses...");
  const courseData = await db.insert(courses).values([
    {
      courseName: "IT Support Fundamentals",
      courseType: "immersive",
      courseObjectives: "Learn the fundamentals of IT support including hardware, software, networking, and troubleshooting",
      weeks: 12,
      certificationsBadges: "CompTIA A+",
      domainId: domainData[3].id, // IT Support
      createdBy: "system",
    },
    {
      courseName: "Network Administration",
      courseType: "skill_based",
      courseObjectives: "Master network configuration, management, and security",
      weeks: 8,
      certificationsBadges: "CompTIA Network+",
      domainId: domainData[3].id, // IT Support
      createdBy: "system",
    },
    {
      courseName: "Certified Ethical Hacker (CEH)",
      courseType: "completion_cert",
      courseObjectives: "Learn ethical hacking techniques and security testing methodologies",
      weeks: 10,
      certificationsBadges: "CEH Certification",
      domainId: domainData[1].id, // Cybersecurity
      createdBy: "system",
    },
    {
      courseName: "Full Stack Development",
      courseType: "immersive",
      courseObjectives: "Build modern web applications using React, Node.js, and databases",
      weeks: 15,
      certificationsBadges: "Full Stack Developer Certificate",
      domainId: domainData[0].id, // Software Engineering
      createdBy: "system",
    },
  ]).returning();
  
  // Update course IDs
  for (const course of courseData) {
    await db.update(courses)
      .set({ courseId: `CRS-${course.id}` })
      .where(eq(courses.id, course.id));
  }
  console.log(`✅ Created ${courseData.length} courses`);

  // 5. Link Courses to Job Roles
  console.log("Linking courses to job roles...");
  await db.insert(courseJobRoles).values([
    { courseId: courseData[0].id, jobRoleId: jobRoleData[0].id, isPrimary: 1 }, // IT Support -> IT Support Specialist
    { courseId: courseData[0].id, jobRoleId: jobRoleData[1].id, isPrimary: 0 }, // IT Support -> Help Desk Tech
    { courseId: courseData[1].id, jobRoleId: jobRoleData[2].id, isPrimary: 1 }, // Network Admin -> Network Administrator
    { courseId: courseData[1].id, jobRoleId: jobRoleData[3].id, isPrimary: 0 }, // Network Admin -> Network Engineer
    { courseId: courseData[2].id, jobRoleId: jobRoleData[5].id, isPrimary: 1 }, // CEH -> Ethical Hacker
    { courseId: courseData[2].id, jobRoleId: jobRoleData[4].id, isPrimary: 0 }, // CEH -> Cybersecurity Analyst
    { courseId: courseData[3].id, jobRoleId: jobRoleData[6].id, isPrimary: 1 }, // Full Stack -> Full Stack Developer
    { courseId: courseData[3].id, jobRoleId: jobRoleData[7].id, isPrimary: 0 }, // Full Stack -> Software Engineer
  ]);
  console.log("✅ Linked courses to job roles");

  // 6. Create Sample Pathways
  console.log("Creating pathways...");
  await db.insert(pathways).values([
    {
      prerequisiteCourseId: courseData[0].id, // IT Support
      nextCourseId: courseData[1].id, // Network Admin
      order: 1,
      createdBy: "system",
    },
    {
      prerequisiteCourseId: courseData[1].id, // Network Admin
      nextCourseId: courseData[2].id, // CEH
      order: 2,
      createdBy: "system",
    },
  ]);
  console.log("✅ Created pathways");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Admin Credentials:");
  console.log("   Username: admin");
  console.log("   Password: Admin123!");
  console.log("\n🌐 You can now deploy to Vercel!");

  await client.end();
}

// Import eq from drizzle-orm
import { eq } from "drizzle-orm";

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});

