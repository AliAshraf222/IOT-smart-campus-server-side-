// import { Request, Response } from "express";
// import { AiServices } from "../services/aiServices";
// import { deleteFile, updateAttendanceWithSheetJS } from "../utils/excelsheet";
// import { EmailService } from "../services/emailService";
// import { takeScreenshot } from "../utils/camera";
// import path from "path";
// import { Database } from "../database/db";
// import { emptyDirectory } from "~/utils/removeimages";
// import { AppError } from "~/utils/appError";

// // A simple function to wait for some time
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// export class AiController {
//   private aiServices: AiServices = new AiServices();
//   private emailService: EmailService = new EmailService();
//   private isAttendanceRunning = false;
//   private currentCourseId: string = "0";
//   private currentHallName: string = "";
//   private db: Database = new Database();

//   /**
//    * This is the main loop. It will run forever until we flip the switch off.
//    * It's an async function so we can use `await` inside it.
//    */
//   async runAttendanceLoop(users: any) {
//     console.log(`ATTENDANCE LOOP STARTED for course: ${this.currentCourseId}`);
//     const cam = await this.db.getCamerasByHallName(this.currentHallName);
//     if (cam.length === 0) {
//       throw new AppError(
//         `no cameras found for this hall ${this.currentHallName}`,
//         404
//       );
//     }
//     // This is your "while (true)" loop, but it's safe because it checks our switch.
//     while (this.isAttendanceRunning) {
//       console.log(`----------------------------------`);
//       console.log(`Starting new attendance check...`);

//       // 1. Take a screenshot and wait for it to finish.
//       const imagePath = await takeScreenshot(
//         cam[0].username,
//         cam[0].password,
//         cam[0].camera_ip
//       );

//       // 2. Call the AI service with the screenshot and wait for the result.
//       const attendance = await this.aiServices.attendance2(imagePath, users);
//       const attendance_obj = JSON.parse(attendance[attendance.length - 2]);
//       console.log("Found students:", attendance_obj);

//       // 3. Update your spreadsheet if students were found.
//       if (Object.keys(attendance_obj).length > 0) {
//         updateAttendanceWithSheetJS(attendance_obj, this.currentCourseId);
//         console.log("Spreadsheet updated.");
//       }

//       // 4. Wait for 30 seconds before the next loop starts.
//       console.log("Waiting 10 seconds for the next check...");
//       await delay(10000);
//     }

//     // This message will appear only when the loop has been stopped.
//     console.log(`ATTENDANCE LOOP STOPPED for course: ${this.currentCourseId}`);
//     this.currentCourseId = "0"; // Reset the course ID
//   }

//   embedding = async (req: Request, res: Response) => {
//     await this.aiServices.embedding();
//     res.status(200).json({
//       message: "embedding successfully"
//     });
//   };

//   attendance = async (req: Request, res: Response) => {
//     const courseid = req.body.courseid;
//     const HallName = req.body.HallName.toUpperCase();

//     const users = await this.db.getUsersWithRoleInCourse(courseid, "student");

//     if (users.length === 0) {
//       throw new AppError(`No users found for this courseid ${courseid}`, 404);
//     }
//     for (const user of users) {
//       if (user.encodedimagedata) {
//         user.encodedimagedata = JSON.parse(user.encodedimagedata);
//       }
//     }
//     console.log(
//       `Received start request for course: ${courseid} in Hall: ${HallName}`
//     );

//     // Start the loop. IMPORTANT: Do not `await` this call.
//     // We want to send the HTTP response immediately while the loop runs in the background.
//     this.runAttendanceLoop(courseid);

//     // Check if it's already running
//     if (this.isAttendanceRunning) {
//       throw new AppError(
//         `Attendance is already running for course ${this.currentCourseId}. Stop it first.`,
//         400
//       );
//     }

//     // 1. Flip the switch ON
//     this.isAttendanceRunning = true;
//     this.currentCourseId = courseid;
//     this.currentHallName = HallName;
//     this.runAttendanceLoop(users);
//     res.status(200).json({
//       message: `Attendance service started for course ${courseid}.`
//     });
//   };

//   //not finished
//   stopService = async (req: Request, res: Response) => {
//     const email: string = req.body.email;
//     const courseId: string = req.body.courseId;
//     console.log("req.body", req.body);
//     if (!email) {
//       throw new AppError("Email is required", 400);
//     }
//     console.log("email:", email);
//     // Check if it's not running
//     if (!this.isAttendanceRunning) {
//       throw new AppError("Attendance is not running", 400);
//     }

//     // 1. Flip the switch OFF
//     this.isAttendanceRunning = false;
//     this.currentCourseId = "0";

//     const filePath: string = path.join(
//       process.cwd(),
//       "sheets",
//       courseId,
//       "attendance.xlsx"
//     );
//     await this.emailService.sendEmailWithAttachment({
//       filePath: filePath,
//       to: email
//     });
//     deleteFile(filePath);
//     emptyDirectory(path.join(process.cwd(), "screenshots"));
//     // 2. The `while` loop will see the switch is off and will exit by itself.

//     // 3. Immediately tell the user that the service has been told to stop.
//     res.status(200).json({
//       message: "Attendance service stopping. It will finish its current cycle."
//     });
//   };

//   sendEmail = async (req: Request, res: Response) => {
//     const courseId: string = req.body.courseId;
//     const filePath: string = path.join(
//       process.cwd(),
//       "sheets",
//       courseId,
//       "attendance.xlsx"
//     );
//     await this.emailService.sendEmailWithAttachment({
//       filePath,
//       to: "alialiali221017@gmail.com"
//     });
//     res.status(200).json({
//       message: "Email sent successfully"
//     });
//   };

//   upload = async (req: Request, res: Response) => {
//     const user_id = req.params.id;
//     const { imagePath } = req.body;
//     const full_image_path = imagePath.replace(/\\src/g, "");
//     await this.aiServices.upload(user_id, full_image_path);
//     res.status(200).json({
//       message: "uploaded successfully",
//       data: { user_id, imagePath, full_image_path }
//     });
//   };

//   licenseplate = async (req: Request, res: Response) => {
//     const { imagePath } = req.body;
//     const licenseplate = await this.aiServices.licenseplate(imagePath);
//     res.status(200).json({
//       message: "uploaded successfully",
//       data: { licenseplate }
//     });
//   };
// }
// // 401 Unauthorized
