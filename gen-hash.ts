import bcrypt from "bcryptjs";

async function generateHash() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hash:", hash);
  
  // Verify it works
  const isMatch = await bcrypt.compare(password, hash);
  console.log("Verification:", isMatch);
}

generateHash();

