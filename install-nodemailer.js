import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Installing nodemailer package...");

try {
  // Run npm install command
  execSync("npm install nodemailer", { stdio: "inherit" });
  console.log("Successfully installed nodemailer");

  // Create a temporary file to indicate success
  fs.writeFileSync(
    path.join(__dirname, "nodemailer-installed.txt"),
    "Nodemailer was installed at " + new Date().toISOString()
  );

  console.log("You can now restart your application.");
} catch (error) {
  console.error("Failed to install nodemailer:", error.message);
  console.log("\nAlternative installation methods:");
  console.log("1. Run this command in your terminal or command prompt:");
  console.log("   npm install nodemailer");
  console.log("2. Or if using yarn:");
  console.log("   yarn add nodemailer");
}
