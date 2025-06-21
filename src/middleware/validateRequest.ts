import { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodSchema, z } from "zod";

//sanitization middleware email based attacks
export const sanitizeEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // only process if request body cotains email
  if (req.body.email) {
    // req. body && to make sure that body is not undefined
    req.body.email = req.body.email.trim().toLowerCase();

    //simple regex validation as a backup for zod
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      res.status(400).json({
        status: "error",
        message: "Invalid email format"
      });
      return;
    }
  }
  next();
};

export const validateContentType = (
  allwoedTypes: string[] = ["application/json"]
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // skipe for get and options requests
    if (req.method === "GET" || req.method === "OPTIONS") {
      next();
      return;
    }
    // check content type
    const contentType = req.headers["content-type"] || "";
    const isAllowed = allwoedTypes.some((type) => contentType.includes(type));
    if (!isAllowed) {
      res.status(415).json({
        status: "error",
        message:
          "Unsupported Media Type.Allowed types are " + allwoedTypes.join(", ")
      });
      return;
    }
    next();
  };
};

type ValidationSource = "body" | "query" | "params";

// Define a type for custom error messages
interface ErrorWithMessage {
  message: string;
}

/**
 * Middleware to validate request data using Zod schemas
 * Validates request body, query parameters, or URL parameters
 */
export const validate = (
  schema: ZodSchema,
  source: ValidationSource = "body"
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get the data from the specified source
      const sourceData =
        source === "body"
          ? req.body
          : source === "query"
            ? req.query
            : req.params;

      // Validate request data against schema
      const validatedData = schema.parse(sourceData);

      // Replace the source data with validated data
      if (source === "body") {
        req.body = validatedData;
      } else if (source === "query") {
        req.query = validatedData;
      } else if (source === "params") {
        req.params = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod error for better readability
        const errors = error.errors.map((err) => {
          // Handle empty path arrays (which happen when the entire body is missing)
          const fieldPath = err.path.length > 0 ? err.path.join(".") : "";

          // If we have an empty field but the error is about a required field
          if (
            !fieldPath &&
            err.code === "invalid_type" &&
            err.message.includes("Required")
          ) {
            // This is likely a case where the entire body is missing or fields are missing
            // We'll try to extract required field information from the schema
            try {
              // Get the shape of the schema if it's an object schema
              const shape = (schema as z.ZodObject<z.ZodRawShape>)._def.shape();
              if (shape) {
                // Create errors for each required field
                return Object.entries(shape).map(([key, fieldSchema]) => {
                  // Check if the field has a required_error message
                  const fieldDef = fieldSchema as z.ZodTypeAny;
                  let errorMessage = "Required";

                  // Try to extract custom error message if available
                  if (fieldDef._def?.errorMap) {
                    const customError = fieldDef._def.errorMap(
                      {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined"
                      },
                      { data: undefined, defaultError: "Required" }
                    );
                    if (customError) {
                      // Extract the message string if it's an object
                      errorMessage =
                        typeof customError === "string"
                          ? customError
                          : (customError as ErrorWithMessage).message ||
                            "Required";
                    }
                  }

                  return {
                    field: key,
                    message: errorMessage
                  };
                });
              }
            } catch {
              // If we can't extract schema information, fall back to the original error
            }
          }

          // Extract the message string if it's an object with a message property
          let errorMessage = err.message;

          // Check if the error message is an object with a message property
          if (
            typeof errorMessage === "object" &&
            errorMessage !== null &&
            "message" in errorMessage
          ) {
            errorMessage = (errorMessage as ErrorWithMessage).message;
          }

          return {
            field: fieldPath,
            message: errorMessage
          };
        });

        // Flatten the array in case we generated multiple errors for missing fields
        const flattenedErrors = errors.flat();

        res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: flattenedErrors
        });
        return;
      }

      next(error);
    }
  };
};
