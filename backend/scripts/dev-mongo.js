/* eslint-disable no-console */
// Standalone local MongoDB instance for development, since no system MongoDB
// is installed in this environment. Not part of the app itself - production
// deployments should point MONGODB_URI at a real MongoDB instance/cluster.
const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27018, dbName: "productivity_tracker" },
  });
  console.log("DEV_MONGO_READY", mongod.getUri("productivity_tracker"));

  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });
}

main();
