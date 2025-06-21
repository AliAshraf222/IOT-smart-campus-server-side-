import { EmailService } from "./emailService";
import { Database } from "../database/db";
import { AppError } from "~/utils/appError";
import { PythonShell, Options } from "python-shell";
import path from "path";
import { postNumber } from "../utils/senddatatoesp";
import admin, { ServiceAccount } from "firebase-admin";
// ✅ Path to your downloaded service account JSON
import serviceAccount from "../../smartcampus.json";

// ✅ Initialize with your credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
});

const db2 = admin.firestore();

interface registerData {
  id: string;
  age: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  image?: string;
}

interface loginData {
  email: string;
  password: string;
}

interface ali {
  name: string;
  id: number;
}

export class AiServices {
  private emailService = new EmailService();
  private db = new Database();

  async embedding() {
    const users = await this.db.getAllUsersWithoutEncodedImageData();
    if (users.length === 0) {
      throw new AppError("No users found", 404);
    }
    for (const user of users) {
      if (!user.image || !user.id) {
        throw new AppError("User image not found", 404);
      }
      const options = {
        mode: "text" as const,
        pythonOptions: ["-u"],
        scriptPath: "./auto",
        args: [user.image]
      };

      const encodedimagedata = await PythonShell.run(
        "prepare_dataset.py",
        options
      );
      console.log("encodedimagedata", encodedimagedata[0]);

      const updated_user = await this.db.updateUser(user.id, {
        encodedimagedata: encodedimagedata[0]
      });
    }
  }

  // not finished
  // async attendance(courseid:string,imagePath:string){
  //     const users =await this.db.getAllUsersForAttendance();
  //   for (const user of users) {
  //     if(user.encodedimagedata){
  //     user.encodedimagedata = JSON.parse(user.encodedimagedata);
  //     }
  //   }

  //   const usersJsonString = JSON.stringify(users);
  //   const options = {
  //     mode: 'text' as const,
  //     pythonOptions: ['-u'],
  //     scriptPath: path.join(process.cwd(), 'auto'),
  //     args: [imagePath,usersJsonString],
  //   };

  //   const encodedimagedata = await PythonShell.run("recognition.py", options);
  //   console.log(encodedimagedata);
  //   console.log(encodedimagedata[encodedimagedata.length-1]);

  // }

  async upload(user_id: string, imagePath: string) {
    await this.db.updateUser(user_id, {
      image: imagePath
    });
  }

  async attendance2(imagePath: string, users: any): Promise<string[]> {
    console.log("Starting attendance service...");
    const usersJsonString = JSON.stringify(users);
    console.log(`Prepared JSON string for ${users.length} users.`);

    // --- THIS IS THE CRITICAL SECTION THAT MUST BE REPLACED ---
    // We are NOT using `await PythonShell.run()`.
    // We are creating a new Promise to handle the asynchronous, event-driven process.

    return new Promise((resolve, reject) => {
      const options: Options = {
        mode: "text",
        pythonOptions: ["-u"], // unbuffered stdout
        // Correctly point to the folder containing your Python script
        scriptPath: path.join(process.cwd(), "auto"),
        args: [imagePath] // ONLY small arguments go here
      };

      // 1. Create the PythonShell instance. This does NOT run the script yet.
      const pyshell = new PythonShell("../auto/recognition.py", options);
      console.log("PythonShell instance created. Sending data to stdin...");

      // 2. Listen for messages (lines printed to stdout in Python)
      const results: any = [];
      pyshell.on("message", (message) => {
        console.log("Received from Python:", message);
        results.push(message);
      });

      pyshell.on("stderr", (stderr) => {
        console.error("Python STDERR:", stderr);
        // Optional: You could reject here if any stderr output is critical
        // reject(new Error(stderr));
      });

      // The 'close' event is more reliable for knowing when everything is truly finished.
      // It fires after stdout and stderr streams have been closed.
      pyshell.on("close", () => {
        console.log("Python script process closed.");
        // Resolve the promise with the collected results
        resolve(results);
      });

      // The 'error' event handles fundamental process errors (like script not found).
      pyshell.on("error", (err) => {
        console.error("PythonShell process error:", err);
        reject(err);
      });

      // --- CORRECT ORDER ---
      // 1. Send the data to the Python script's stdin.
      console.log("Sending data to python script's stdin...");
      pyshell.send(usersJsonString);

      // 2. Close the stdin stream. This tells the Python script that there is no more data to read.
      // The Python script will then proceed with its logic and start printing results.
      console.log("Finished sending data. Closing stdin stream.");

      pyshell.end((err) => {
        if (err) {
          console.error("Error while closing stdin stream:", err);
          reject(err);
        }
      });
    });
  }

  async licenseplate(imagePath: string) {
    const options = {
      mode: "text" as const,
      pythonOptions: ["-u"],
      scriptPath: "./licenseplate",
      args: [imagePath]
    };
    const licenseplate = await PythonShell.run("test.py", options);
    console.log(licenseplate[licenseplate.length - 2]);
    const parts = licenseplate[licenseplate.length - 2].split(":");
    const li = parts[1].trim();
    const user = await this.db.isLicenseplate(li);
    if (user) {
      const data = {
        licensePlate: li,
        name: user.firstname + " " + user.lastname,
        isauth: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      await db2.collection("AccessLogs").add(data); // Change path if needed
      console.log("License plate uploaded successfully!");
    } else {
      const data = {
        licensePlate: li,
        name: "Unknown",
        isauth: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      await db2.collection("AccessLogs").add(data); // Change path if needed
      console.log("License plate uploaded successfully!");
    }
    console.log("is_licenseplate", li);
    if (user) {
      postNumber(1);
    } else {
      postNumber(0);
    }
    return li;
  }
}
