import mongoose, { type Mongoose } from "mongoose";

mongoose.set("strictQuery", true);

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not defined");
  }
  return uri;
}

const MONGO_URI = getMongoUri();

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

async function disconnect(): Promise<void> {
  if (cached.conn && process.env.NODE_ENV === "production") {
    await mongoose.disconnect();
    cached.conn = null;
  }
}

function convertDocToObj<T extends { _id: unknown }>(
  doc: T & { createdAt?: Date; updatedAt?: Date },
): T & { _id: string; createdAt?: string; updatedAt?: string } {
  const result = doc as T & {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
  };
  result._id = String(doc._id);
  if (doc.createdAt) {
    result.createdAt = doc.createdAt.toString();
  }
  if (doc.updatedAt) {
    result.updatedAt = doc.updatedAt.toString();
  }
  return result;
}

export default { connect, disconnect, convertDocToObj };
