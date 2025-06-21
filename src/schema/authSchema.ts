import { z } from "zod";

export const authSchema = {
  register: z.object({
    firstname: z
      .string()
      .min(3, { message: "firstname must be at least 3 characters long" })
      .optional(),
    lastname: z
      .string()
      .min(3, { message: "lastname must be at least 3 characters long" })
      .optional(),
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string"
      })
      .email("Invalid email format"),
    password: z
      .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string"
      })
      .min(6, "Password must be at least 6 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    id: z.string().optional(),
    image: z.string().optional(),
    role: z.string().optional().default("student"),
    age: z.number().optional(),
    username: z.string().optional(),
  }),
  login: z.object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string"
      })
      .email("Invalid email format"),
    password: z
      .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string"
      })
  }),
  ali: z.object({
    name: z.string().min(3).max(255),
    id: z
      .number()
      .min(1, { message: "Content must be at least 1 number long" })
      .max(1000)
  }),
  verification: z.object({
    token: z
      .string({
        required_error: "token is required",
        invalid_type_error: "token must be a string"
      })
      .length(6, "verification Code must be 6 characters long")
  })
};

//   const postSchema = z.object({
//     title: z.string().min(5, { message: "Title must be at least 5 characters long" }),
//     content: z.string().min(20, { message: "Content must be at least 20 characters long" }),
//     tags: z.array(z.string(), {
//       invalid_type_error: "Tags must be an array of strings",
//     }),
//     isPublished: z.boolean().optional().default(false), // Optional and defaults to false
//   });

