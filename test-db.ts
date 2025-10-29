import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { adminUsers } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres.owozrwohrpttiyiurnbu:pHdjvFzZ2hKbhur8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function testConnection() {
  console.log("DATABASE_URL:", DATABASE_URL.substring(0, 50) + "...");
  console.log("Connecting to database...");
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);
  
  console.log("Querying admin_users table for 'perscholas_admin'...");
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, "perscholas_admin")).limit(1);
  
  console.log("Result:", JSON.stringify(result, null, 2));
  console.log("Found", result.length, "rows");
  
  if (result.length > 0) {
    console.log("User found:", result[0].username, result[0].email);
  } else {
    console.log("User NOT found!");
    console.log("Querying all admin users...");
    const allUsers = await db.select().from(adminUsers);
    console.log("Total admin users:", allUsers.length);
    console.log("Usernames:", allUsers.map(u => u.username));
  }
  
  await client.end();
}

testConnection().catch(console.error);

