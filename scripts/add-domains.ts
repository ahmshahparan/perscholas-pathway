import { drizzle } from "drizzle-orm/mysql2";
import { domains, courses } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function addDomains() {
  console.log("Adding default domains...");

  // Insert default domains
  const defaultDomains = [
    { name: "Software Engineering", description: "Full-stack development, backend, frontend, and DevOps" },
    { name: "Data Science & Analytics", description: "Data analysis, machine learning, and visualization" },
    { name: "Cybersecurity", description: "Security operations, ethical hacking, and compliance" },
    { name: "Cloud Computing", description: "AWS, Azure, cloud architecture, and infrastructure" },
    { name: "IT Support", description: "Technical support, help desk, and system administration" },
    { name: "UX/UI Design", description: "User experience, interface design, and prototyping" },
  ];

  for (const domain of defaultDomains) {
    await db.insert(domains).values(domain);
    console.log(`✓ Added domain: ${domain.name}`);
  }

  console.log("\nDomains added successfully!");
  console.log("\nNote: You'll need to manually update existing courses to assign them to domains.");
  console.log("Run this SQL to set a default domain for existing courses:");
  console.log("UPDATE courses SET domainId = 1 WHERE domainId IS NULL OR domainId = 0;");
}

addDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error adding domains:", error);
    process.exit(1);
  });

