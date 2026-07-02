import mongoose from "mongoose";

let mongod = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/marquee";
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[db] connected to ${uri}`);
    return false;
  } catch (err) {
    if (!process.env.MONGODB_URI) {
      console.log(`[db] Local MongoDB not running on 27017. Spinning up mongodb-memory-server...`);
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "marquee",
        },
      });
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[db] connected to in-memory MongoDB at ${memoryUri}`);
      return true;
    } else {
      throw err;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    console.log("[db] in-memory MongoDB stopped");
  }
}
