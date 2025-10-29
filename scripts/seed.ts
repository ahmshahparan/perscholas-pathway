import { createAdminUser, createCourse, createPathway, getAdminByUsername, getCourseByCourseId } from "../server/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin users
  const adminUsernames = ["admin-global", "admin-it", "admin-se", "admin-manuops", "admin-misc"];
  const defaultPassword = "perscholas2024"; // Default password for all admins

  for (const username of adminUsernames) {
    const existing = await getAdminByUsername(username);
    if (!existing) {
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await createAdminUser({ username, passwordHash });
      console.log(`✅ Created admin user: ${username}`);
    } else {
      console.log(`⏭️  Admin user already exists: ${username}`);
    }
  }

  // Create sample courses
  const sampleCourses = [
    {
      courseName: "Full Stack Web Development Immersive",
      courseType: "immersive" as const,
      courseObjectives: "Comprehensive bootcamp covering HTML, CSS, JavaScript, React, Node.js, and databases",
      weeks: 12,
      certificationsBadges: "Full Stack Developer Certificate",
    },
    {
      courseName: "Data Science Immersive",
      courseType: "immersive" as const,
      courseObjectives: "Intensive program covering Python, statistics, machine learning, and data visualization",
      weeks: 12,
      certificationsBadges: "Data Science Certificate",
    },
    {
      courseName: "UX/UI Design Immersive",
      courseType: "immersive" as const,
      courseObjectives: "Complete design bootcamp covering user research, wireframing, prototyping, and visual design",
      weeks: 10,
      certificationsBadges: "UX/UI Designer Certificate",
    },
    {
      courseName: "AI-Enabled IT Support",
      courseType: "immersive" as const,
      courseObjectives: "CompTIA A+ Cert",
      weeks: 15,
      certificationsBadges: "CompTIA A+ Certificate",
    },
    {
      courseName: "Backend Architecture & Microservices",
      courseType: "skill_based" as const,
      courseObjectives: "Advanced backend development with microservices, Docker, and Kubernetes",
      weeks: 6,
      certificationsBadges: "Backend Specialist Badge",
    },
    {
      courseName: "Advanced React & State Management",
      courseType: "skill_based" as const,
      courseObjectives: "Best for frontend focus",
      weeks: 6,
      certificationsBadges: "Frontend Specialist Badge",
    },
    {
      courseName: "Full Stack Performance Optimization",
      courseType: "completion_cert" as const,
      courseObjectives: "Can also come from backend track",
      weeks: 4,
      certificationsBadges: "Performance Optimization Certificate",
    },
  ];

  const courseIds: number[] = [];

  for (const courseData of sampleCourses) {
    const result = await createCourse(courseData);
    const insertId = Number(result.insertId);
    courseIds.push(insertId);
    console.log(`✅ Created course: ${courseData.courseName} (ID: ${insertId}, Course ID: ${result.courseId})`);
  }

  // Create pathways (bidirectional relationships)
  // courseIds: [0: Full Stack, 1: Data Science, 2: UX/UI, 3: IT Support, 4: Backend, 5: React, 6: Performance]
  const pathwayData = [
    // Full Stack Web Dev Immersive → Backend Architecture
    {
      prerequisiteCourseId: courseIds[0],
      nextCourseId: courseIds[4],
      order: 1,
    },
    // Full Stack Web Dev Immersive → Advanced React
    {
      prerequisiteCourseId: courseIds[0],
      nextCourseId: courseIds[5],
      order: 1,
    },
    // Backend Architecture → Performance Optimization
    {
      prerequisiteCourseId: courseIds[4],
      nextCourseId: courseIds[6],
      order: 1,
    },
  ];

  for (const pathway of pathwayData) {
    await createPathway(pathway);
    console.log(`✅ Created pathway: ${pathway.prerequisiteCourseId} → ${pathway.nextCourseId}`);
  }

  console.log("🎉 Seeding completed!");
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});

