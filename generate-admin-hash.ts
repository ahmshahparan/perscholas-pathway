import bcrypt from "bcryptjs";

async function generateHash() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("\nSQL to create admin:");
  console.log(`INSERT INTO admin_users (username, email, password_hash, role, is_first_login, created_by, created_at, updated_at) VALUES ('admin', 'admin@perscholas.org', '${hash}', 'global_admin', 0, 'system', NOW(), NOW());`);
}

generateHash();

