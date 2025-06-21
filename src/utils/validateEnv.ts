import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// all environment variables are string by default
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform((value) => parseInt(value, 10))
    .default("30000"),

  //   email configuration is optional in dev , required in production
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_SECURE: z.string().optional(),
  VERIFICATION_TOKEN_EXPIRES: z.string().default("24"),
  DATABASE_URL: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string(),
  Refresh_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES: z.string().default("7d")
});

type EnvSchema = z.infer<typeof envSchema>;

let env: EnvSchema;

export function validateEnv(): EnvSchema {
  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid environment variables:", error.errors);
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1); // Exit the process with a failure code
  }
}

export function getEnv(): EnvSchema {
  if (!env) {
    validateEnv(); // Ensure env is validated before accessing it
  }
  return env;
}
