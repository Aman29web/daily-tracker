import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

mongoose.set("strictQuery", true);

export async function connectDB(uri: string = env.mongodbUri): Promise<typeof mongoose> {
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", { err }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
