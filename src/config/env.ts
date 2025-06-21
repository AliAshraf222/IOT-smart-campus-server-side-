import {
  NODE_ENV,
  PORT,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_SECURE,
  VERIFICATION_TOKEN_EXPIRES,
  DATABASE_URL,
  ACCESS_TOKEN_SECRET,
  Refresh_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES
} from "~/constants/env.constants";

export function validateEnv1() {
  try {
    const requiredEnvVariables = [
      NODE_ENV,
      PORT,
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_USER,
      EMAIL_PASS,
      EMAIL_SECURE,
      VERIFICATION_TOKEN_EXPIRES,
      DATABASE_URL,
      ACCESS_TOKEN_SECRET,
      Refresh_TOKEN_SECRET,
      ACCESS_TOKEN_EXPIRES,
      REFRESH_TOKEN_EXPIRES
    ];

    // validate all requried env variables
    const missingVars = requiredEnvVariables.filter((varname) => {
      // return array of undefined variables
      return !process.env[varname] || process.env[varname]?.trim() === ""; // return undefined variables
    });

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
    console.log("Environment variables validated successfully");
  } catch (error) {
    console.error(
      "Error validating environment variables:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}
