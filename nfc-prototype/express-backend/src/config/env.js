import "dotenv/config";

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET"
];

for (const variable of requiredEnv) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET
};