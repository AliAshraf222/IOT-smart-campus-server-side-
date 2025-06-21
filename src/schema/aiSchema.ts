import { z } from "zod";

export const aiSchema = {
  attendance: z.object({
    courseid: z.string({
      required_error: "courseid is required",
      invalid_type_error: "courseid must be a string"
    }),
    HallName: z.string({
      required_error: "HallName is required",
      invalid_type_error: "HallName must be a string"
    })
  }),
  stop: z.object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string"
      })
      .email("Invalid email format"),
    courseId: z.string({
      required_error: "courseId is required",
      invalid_type_error: "courseId must be a string"
    })
  })
};
