import { Request, Response } from "express";
import { AiServices } from "../services/aiServices";
import { deleteFile, updateAttendanceWithSheetJS } from "../utils/excelsheet";
import { EmailService } from "../services/emailService";
import { takeScreenshot } from "../utils/camera";
import path from "path";
import { Database } from "../database/db";
import { emptyDirectory } from "~/utils/removeimages";
import { AppError } from "~/utils/appError";

// A simple function to wait for some time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class AiController {
  private aiServices: AiServices = new AiServices();
  private emailService: EmailService = new EmailService();
  private db: Database = new Database();
  private runningSessions: {
    [courseid: string]: { hallName: string };
  } = {};

  /**
   * This is the main loop. It will run forever until we flip the switch off.
   * It's an async function so we can use `await` inside it.
   */

  async runAttendanceLoop(courseid: string, users: any[]) {
    const session = this.runningSessions[courseid];
    if (!session) {
      throw new AppError("no session found for this courseid", 400);
    }

    const hallName = session.hallName;
    console.log(`ATTENDANCE LOOP STARTED for course: ${courseid}`);

    const cams = await this.db.getCamerasByHallName(hallName);
    if (cams.length === 0) {
      delete this.runningSessions[courseid];
      throw new AppError(`no cameras found for this hall ${hallName}`, 404);
    }

    // This is your main control loop.
    while (this.runningSessions[courseid]) {
      console.log(`----------------------------------`);
      console.log(`[Course: ${courseid}] Starting new attendance check...`);

      try {
        // 1. Take screenshots from ALL cameras IN PARALLEL.
        // We create an array of promises, where each promise is a call to takeScreenshot.
        console.log(
          `[Course: ${courseid}] Taking screenshots from ${cams.length} cameras...`
        );
        const screenshotPromises = cams.map((cam: any) =>
          takeScreenshot(cam.username, cam.password, cam.camera_ip, courseid)
        );

        // Promise.all waits for every promise in the array to resolve.
        // It returns an array of the results (the image paths).
        let imagePaths = await Promise.all(screenshotPromises);
        console.log(`[Course: ${courseid}] All screenshots captured.`);

        // 2. Process each screenshot and collect all attendance data.
        let allDetectedStudents = {};
        while (imagePaths.length > 0) {
          // do 3 parrlell process in the same time
          const counter = Math.min(3, imagePaths.length);
          const attendance_promises = await Promise.all(
            imagePaths
              .slice(0, counter)
              .map((imagePath) => this.aiServices.attendance2(imagePath, users))
          );
          for (const attendance of attendance_promises) {
            const attendance_obj = JSON.parse(
              attendance[attendance.length - 2]
            );
            console.log(
              `[Course: ${courseid}] Found students in one view:`,
              attendance_obj
            );
            allDetectedStudents = { ...allDetectedStudents, ...attendance_obj };
          }

          imagePaths = imagePaths.slice(counter);
        }

        // 4. Update the spreadsheet ONCE with the combined results from all cameras.
        if (Object.keys(allDetectedStudents).length > 0) {
          console.log(
            `[Course: ${courseid}] Total unique students found:`,
            allDetectedStudents
          );
          updateAttendanceWithSheetJS(allDetectedStudents, courseid);
          console.log(`[Course: ${courseid}] Spreadsheet updated.`);
        } else {
          console.log(
            `[Course: ${courseid}] No students found in any camera view this cycle.`
          );
        }
      } catch (error) {
        // If any screenshot or AI call fails, log it and continue the loop.
        console.error(
          `[Course: ${courseid}] An error occurred during the attendance check:`,
          error
        );
      }

      // 5. Wait for a single, defined interval before the next full cycle.
      const delayInterval = 15000; // 15 seconds
      console.log(
        `[Course: ${courseid}] Waiting ${delayInterval / 1000} seconds for the next check...`
      );
      await delay(delayInterval);
    }

    // This message will appear only when the loop has been stopped.
    console.log(`[Course: ${courseid}] ATTENDANCE LOOP STOPPED.`);
  }

  // async runAttendanceLoop(courseid: string, users: any[]) {
  //   const session = this.runningSessions[courseid];
  //   if (!session) {
  //     throw new AppError("no session found for this courseid", 400);
  //   }

  //   const hallName = session.hallName;
  //   console.log(`ATTENDANCE LOOP STARTED for course: ${courseid}`);

  //   const cams = await this.db.getCamerasByHallName(hallName);
  //   if (cams.length === 0) {
  //     delete this.runningSessions[courseid];
  //     throw new AppError(`no cameras found for this hall ${hallName}`, 404);
  //   }

  //   // This is your main control loop.
  //   while (this.runningSessions[courseid]) {
  //     console.log(`----------------------------------`);
  //     console.log(`[Course: ${courseid}] Starting new attendance check...`);

  //     try {
  //       // 1. Take screenshots from ALL cameras IN PARALLEL.
  //       // We create an array of promises, where each promise is a call to takeScreenshot.
  //       console.log(
  //         `[Course: ${courseid}] Taking screenshots from ${cams.length} cameras...`
  //       );
  //       const screenshotPromises = cams.map((cam: any) =>
  //         takeScreenshot(cam.username, cam.password, cam.camera_ip, courseid)
  //       );

  //       // Promise.all waits for every promise in the array to resolve.
  //       // It returns an array of the results (the image paths).
  //       const imagePaths = await Promise.all(screenshotPromises);
  //       console.log(`[Course: ${courseid}] All screenshots captured.`);

  //       // 2. Process each screenshot and collect all attendance data.
  //       let allDetectedStudents = {};

  //       for (const imagePath of imagePaths) {
  //         // We process the AI calls sequentially here to avoid overwhelming the AI service.
  //         // This is still much faster because all images were taken at the same time.
  //         const attendance = await this.aiServices.attendance2(
  //           imagePath,
  //           users
  //         );
  //         const attendance_obj = JSON.parse(attendance[attendance.length - 2]);
  //         console.log(
  //           `[Course: ${courseid}] Found students in one view:`,
  //           attendance_obj
  //         );

  //         // 3. Aggregate results. Merge students from this camera into our main object.
  //         // Object.assign will add new students and overwrite existing ones (which is fine).
  //         allDetectedStudents = { ...allDetectedStudents, ...attendance_obj };
  //       }

  //       // 4. Update the spreadsheet ONCE with the combined results from all cameras.
  //       if (Object.keys(allDetectedStudents).length > 0) {
  //         console.log(
  //           `[Course: ${courseid}] Total unique students found:`,
  //           allDetectedStudents
  //         );
  //         updateAttendanceWithSheetJS(allDetectedStudents, courseid);
  //         console.log(`[Course: ${courseid}] Spreadsheet updated.`);
  //       } else {
  //         console.log(
  //           `[Course: ${courseid}] No students found in any camera view this cycle.`
  //         );
  //       }
  //     } catch (error) {
  //       // If any screenshot or AI call fails, log it and continue the loop.
  //       console.error(
  //         `[Course: ${courseid}] An error occurred during the attendance check:`,
  //         error
  //       );
  //     }

  //     // 5. Wait for a single, defined interval before the next full cycle.
  //     const delayInterval = 15000; // 15 seconds
  //     console.log(
  //       `[Course: ${courseid}] Waiting ${delayInterval / 1000} seconds for the next check...`
  //     );
  //     await delay(delayInterval);
  //   }

  //   // This message will appear only when the loop has been stopped.
  //   console.log(`[Course: ${courseid}] ATTENDANCE LOOP STOPPED.`);
  // }

  embedding = async (req: Request, res: Response) => {
    await this.aiServices.embedding();
    res.status(200).json({
      message: "embedding successfully"
    });
  };

  attendance = async (req: Request, res: Response) => {
    const courseid = req.body.courseid;
    const HallName = req.body.HallName.toUpperCase();

    // 1. Check if a session FOR THIS SPECIFIC COURSE is already running.
    if (this.runningSessions[courseid]) {
      throw new AppError(
        `Attendance is already running for course ${courseid}. Stop it first.`,
        400
      );
    }

    const users = await this.db.getUsersWithRoleInCourse(courseid, "student");

    if (users.length === 0) {
      throw new AppError(`No users found for this courseid ${courseid}`, 404);
    }
    for (const user of users) {
      if (user.encodedimagedata) {
        user.encodedimagedata = JSON.parse(user.encodedimagedata);
      }
    }
    console.log(
      `Received start request for course: ${courseid} in Hall: ${HallName}`
    );

    // 2. Add this course to our running sessions object. This is our "switch".
    this.runningSessions[courseid] = {
      hallName: HallName
    };

    // 3. Start the loop. IMPORTANT: Do not `await` this call.
    // We want to send the HTTP response immediately while the loop runs in the background.
    this.runAttendanceLoop(courseid, users);

    res.status(200).json({
      message: `Attendance service started for course ${courseid}.`
    });
  };

  //not finished
  stopService = async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const courseid: string = req.body.courseId;
    console.log("req.body", req.body);
    if (!email || !courseid) {
      throw new AppError("Email and courseid are required", 400);
    }
    console.log("email:", email);
    console.log("courseid:", courseid);
    // 1. Check if there's a session to stop.
    if (!this.runningSessions[courseid]) {
      throw new AppError(
        `Attendance is not currently running for course ${courseid}.`,
        404
      );
    }

    // 1. stop the attendance loop for this course
    delete this.runningSessions[courseid];

    const filePath: string = path.join(
      process.cwd(),
      "sheets",
      courseid,
      "attendance.xlsx"
    );
    await this.emailService.sendEmailWithAttachment({
      filePath: filePath,
      to: email
    });
    deleteFile(filePath);
    emptyDirectory(path.join(process.cwd(), "screenshots", courseid));
    // 2. The `while` loop will see the switch is off and will exit by itself.
    console.log(
      `Received stop request for course: ${courseid}. Session will terminate shortly.`
    );
    // 3. Immediately tell the user that the service has been told to stop.
    res.status(200).json({
      message: "Attendance service stopping. It will finish its current cycle."
    });
  };

  sendEmail = async (req: Request, res: Response) => {
    const courseId: string = req.body.courseId;
    const filePath: string = path.join(
      process.cwd(),
      "sheets",
      courseId,
      "attendance.xlsx"
    );
    await this.emailService.sendEmailWithAttachment({
      filePath,
      to: "alialiali221017@gmail.com"
    });
    res.status(200).json({
      message: "Email sent successfully"
    });
  };

  upload = async (req: Request, res: Response) => {
    const user_id = req.params.id;
    const { imagePath } = req.body;
    const full_image_path = imagePath.replace(/\\src/g, "");
    await this.aiServices.upload(user_id, full_image_path);
    res.status(200).json({
      message: "uploaded successfully",
      data: { user_id, imagePath, full_image_path }
    });
  };

  licenseplate = async (req: Request, res: Response) => {
    const { imagePath } = req.body;
    const licenseplate = await this.aiServices.licenseplate(imagePath);
    res.status(200).json({
      message: "uploaded successfully",
      data: { licenseplate }
    });
  };
}
// 401 Unauthorized
