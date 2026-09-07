import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env";

// Force public DNS resolvers to prevent cloud container SRV lookup failures
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("Could not set custom DNS servers:", dnsErr);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4, // Force IPv4 to avoid IPv6 timeout bugs on cloud containers
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred while connecting to MongoDB");
    }
    process.exit(1);
  }
};

export default connectDB;
