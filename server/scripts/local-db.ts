/**
 * Runs a real mongod on port 27017 for machines without MongoDB or Docker.
 * The binary is downloaded on first run; data persists in server/.mongo-data.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = resolve(import.meta.dirname, "../.mongo-data");
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, ip: "127.0.0.1", dbPath, storageEngine: "wiredTiger" },
});

console.log(`MongoDB ready at ${server.getUri()} (data in ${dbPath})`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
