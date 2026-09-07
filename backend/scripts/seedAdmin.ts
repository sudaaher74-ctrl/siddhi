import dotenv from "dotenv";
import User from "../src/models/User";
import connectDB from "../src/config/db";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if the admin already exists
    const adminEmail = "admin@siddhi.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit();
    }

    // Create a new admin user
    await User.create({
      name: "Siddhi Admin",
      phone: "1234567890",
      email: adminEmail,
      password: "password123",
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@siddhi.com");
    console.log("Password: password123");
    
    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

seedAdmin();
