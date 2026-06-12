# Auth MongoDB client

Source: [`app/api/auth/lib/mongodb.ts`](../../../../app/api/auth/lib/mongodb.ts)

Singleton `MongoClient` promise for NextAuth MongoDB adapter. Dev caches on `global._mongoClientPromise` for HMR.

Imported by [`lib/auth.ts`](../../../../lib/auth.ts).
