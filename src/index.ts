import dotenv from "dotenv";
dotenv.config();
import { validateEnv1 } from "./config/env";
validateEnv1();
import * as fs from "fs";
import helmet from "helmet";
import * as path from "path";
import express, { Express, Request, Response } from "express";
import rootRouter from "./routes";
import { validateEnv } from "./utils/validateEnv";
// Prisma
import { PrismaClient } from "@prisma/client";
import { Database } from "./database/db";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import { corsConfig } from "./middleware/security";
import { globalRateLimit } from "./middleware/ratelimit";
import { EmailService } from "./services/emailService";
import { PythonShell } from "python-shell";
import multer from "multer";
import cors from "cors";
import console from "console";
// Initialize Prisma client
const prisma = new PrismaClient();
// Initialize Database client
const db = new Database();
// to getenv  const{ envvariables } = getEnv();
validateEnv();
const emailService = new EmailService();
const app: Express = express();
const port: number = parseInt(process.env.PORT || "30000", 10); // redix 10 =>decimal system
app.set("trust proxy", 1);
app.use(helmet()); //hide some headers related to what the server is using like framework
app.use(cookieParser()); // to parse cookies
app.use(express.json()); // to parse json data
app.use(globalRateLimit); // global rate limit
// app.use(corsConfig); // custom cors configuration
app.use(express.urlencoded({ limit: "100kb", extended: true })); // to parse url encoded data like form data from user

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api", rootRouter);

// ============ upload image ============
// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const user_id = req.params.id;
    const folderPath = path.join(__dirname, "..", "images", user_id);
    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const user_id = req.params.id;
    // Use timestamp to avoid overwriting
    const uniqueName = `${user_id}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer configuration with file filter and size limit
const upload = multer({ storage });

// Endpoint to handle image upload
app.post("/upload/:id", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }
  const folderPath = path.join(
    __dirname,
    "..",
    "images",
    req.params.id,
    `${req.file.filename}`
  );
  await prisma.user.update({
    where: {
      id: req.params.id
    },
    data: {
      image: folderPath
    }
  });
  res.status(200).json({
    message: "Image uploaded successfully",
    filename: req.file.filename,
    folderPath: req.file.destination
  });
});
// ===================

app.post("/createcourse", async (req: Request, res: Response) => {
  const { id, name, category } = req.body;
  const course = await db.createCourse({
    id,
    name,
    category
  });
  res.status(200).json(course);
});

app.post("/enrolluserincourse", async (req: Request, res: Response) => {
  const { userId, courseId } = req.body;
  const enrollment = await db.enrollUserInCourse({
    userId,
    courseId,
    role: "student"
  });
  res.status(200).json(enrollment);
});

app.get("/getcourseenrollments", async (req: Request, res: Response) => {
  const { courseId } = req.query;
  const enrollments = await db.getCourseEnrollments(courseId as string);
  res.status(200).json(enrollments);
});

app.get("/msg", (req: Request, res: Response) => {
  console.log(`req clinet is ${req.url}`);

  res.status(200).send("Hello World!");
});

app.get("/users", (req: Request, res: Response) => {
  const users = [
    { id: 1, name: "Ali" },
    { id: 1, name: "Aashraf" },
    { id: 1, name: "khairy" }
  ];

  const path_users = path.join(__dirname, "data", "users.json");
  const users2 = JSON.parse(fs.readFileSync(path_users, "utf-8"));

  res.status(200).send(users2);
});

const htmlPath = path.join(__dirname, "public", "index.html");

const html = fs.readFileSync(htmlPath, "utf-8");

const path_data = path.join(__dirname, "data", "data.json");
const users2 = JSON.parse(fs.readFileSync(path_data, "utf-8"));

app.get("/html", (req: Request, res: Response) => {
  res.status(200).send(html);
});

app.post("/createuser", async (req: Request, res: Response) => {
  const {
    id,
    firstname,
    isVerified,
    lastname,
    verificationCodeExpiers,
    password,
    username,
    age
  } = req.body;
  const user = await prisma.user.create({
    data: {
      id,
      firstname,
      lastname,
      password,
      isVerified: true,
      username,
      age: age || 18, // Default to 18 if age is not provided
      email: `${firstname}.${lastname}@gmail.com`,
      verificationCodeExpiers
    }
  });
  res.status(200).json(user);
});

app.get("/allusers", async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  // console.log(JSON.stringify(users));
  res.status(200).json(users);
});

app.get("/user/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json(user);
});

app.patch("/user/:id", async (req: Request, res: Response) => {
  const { licenseplate } = req.body;
  const user = await prisma.user.update({
    where: {
      id: req.params.id
    },
    data: {
      licenseplate
    }
  });
  res.status(200).json(user);
});

app.delete("/user/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.delete({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json({
    message: "User deleted successfully",
    user
  });
});

app.post("/createcourse", async (req: Request, res: Response) => {
  const { id, name } = req.body;
  const course = await prisma.courses.create({
    data: {
      id,
      name
    }
  });
  res.status(200).json(course);
});

// enroll user in course
app.post("/enrolluserincourse", async (req: Request, res: Response) => {
  const { userId, courseId, role } = req.body;
  const enrollment = await db.enrollUserInCourse({
    userId,
    courseId,
    role
  });
  res.status(200).json(enrollment);
});

app.get("/getcourseenrollments", async (req: Request, res: Response) => {
  const { courseId } = req.body;
  const enrollments = await db.getCourseEnrollments(courseId as string);
  res.status(200).json(enrollments);
});

app.post("/embedding/:id", async (req: Request, res: Response) => {
  const image_path = "./uploads/hussein.jpg";
  const options = {
    mode: "text" as const,
    pythonOptions: ["-u"],
    scriptPath: "./auto",
    args: [image_path]
  };

  const encodedimagedata = await PythonShell.run("prepare_dataset.py", options);
  console.log("encodedimagedata", encodedimagedata[0]);

  const user = await prisma.user.update({
    where: {
      id: req.params.id
    },
    data: {
      encodedimagedata: encodedimagedata[0]
    }
  });
  res.status(200).json(user);
});

app.post("/recognize", async (req: Request, res: Response) => {
  const image_path = "./uploads/sheikhyasser2.jpg";
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.encodedimagedata) {
      user.encodedimagedata = JSON.parse(user.encodedimagedata);
    }
  }
  const options = {
    mode: "text" as const,
    pythonOptions: ["-u"],
    scriptPath: "./auto",
    args: [image_path, JSON.stringify(users)]
  };
  const encodedimagedata = await PythonShell.run("recognition.py", options);

  console.log(encodedimagedata[encodedimagedata.length - 1]);
  // {"1": "Ali Ashraf"}
  // {"1": "Ali Ashraf"}

  res
    .status(200)
    .json(JSON.parse(encodedimagedata[encodedimagedata.length - 1]));
});

// app.patch("/embedding/:id", async (req: Request, res: Response) => {
//   const image_path = path.join(__dirname, "uploads", "hussein.jpg");
//   const options = {
//     args: [image_path],
//     pythonPath: 'python3' // or 'python' depending on your system
// };
//   const encodedimagedata = await PythonShell.run("./auto/prepare_dataset.py", options, (err) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//   });
//   const user = await prisma.user.update({
//     where: {
//       id: req.params.id
//     },
//     data: {
//       encodedimagedata
//     }
//   });
//   res.status(200).json(user);
// });

app.get("/user/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json(user?.encodedimagedata);
});

app.delete("/deleteallusers", async (req: Request, res: Response) => {
  const users = await prisma.user.deleteMany();
  res.status(200).json({
    message: "Users deleted successfully",
    users
  });
});

app.post("/api/receive-pin/:id", async (req: Request, res: Response) => {
  const { percentage } = req.body;
  //update trashcan level to 1
  const trashcan = await prisma.trashCan.update({
    where: {
      id: req.params.id
    },
    data: {
      level: 1
    }
  });
  emailService.sendtrashcanemail({ location: trashcan.location });
  console.log("Received value:", percentage);
  res.status(200).json({ message: "Number received successfully", percentage });
});

const mainpath = path.join(__dirname, "..", "views", "index.html");

app.get("/", (req: Request, res: Response) => {
  res.sendFile(mainpath);
});

app.get(
  "/getuserswithroleincourse/:courseid",
  async (req: Request, res: Response) => {
    const users = await db.getUsersWithRoleInCourse(
      req.params.courseid,
      "student"
    );
    res.status(200).json(users);
  }
);

app.patch("/updateuser/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: {
      id: req.params.id
    },
    data: {
      ...req.body
    }
  });
  res.status(200).json(user);
});

//create hall name A
app.post("/createhall", async (req: Request, res: Response) => {
  const { name } = req.body;
  const hall = await prisma.hall.create({
    data: {
      name
    }
  });
  res.status(200).json(hall);
});

//create camera
app.post("/createcamera", async (req: Request, res: Response) => {
  const { hallname, username, password, camera_ip } = req.body;
  const camera = await prisma.camera.create({
    data: {
      hallname,
      username,
      password,
      camera_ip
    }
  });
  res.status(200).json(camera);
});

app.get("/gethalls", async (req: Request, res: Response) => {
  const halls = await prisma.hall.findMany();
  res.status(200).json(halls);
});

app.get("/getcameras", async (req: Request, res: Response) => {
  const cameras = await prisma.camera.findMany();
  res.status(200).json(cameras);
});

app.get(
  "/getcamerasbyhallname/:hallname",
  async (req: Request, res: Response) => {
    const cameras = await prisma.camera.findMany({
      where: {
        hallname: req.params.hallname.toUpperCase()
      }
    });
    res.status(200).json(cameras);
  }
);

app.patch("/updatecamera/:id", async (req: Request, res: Response) => {
  const camera = await prisma.camera.update({
    where: {
      id: req.params.id
    },
    data: {
      ...req.body
    }
  });
  res.status(200).json(camera);
});

app.delete("/deletecamera/:id", async (req: Request, res: Response) => {
  const camera = await prisma.camera.delete({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json({
    message: "Camera deleted successfully",
    camera
  });
});

// delete hall
app.delete("/deletehall/:id", async (req: Request, res: Response) => {
  const hall = await prisma.hall.delete({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json({
    message: "Hall deleted successfully",
    hall
  });
});

//trashcan
app.post("/createtrashcan", async (req: Request, res: Response) => {
  const { location } = req.body;
  const trashcan = await prisma.trashCan.create({
    data: {
      location
    }
  });
  res.status(200).json(trashcan);
});

app.get("/gettrashcans", async (req: Request, res: Response) => {
  const trashcans = await prisma.trashCan.findMany();
  res.status(200).json(trashcans);
});

app.get("/gettrashcan/:id", async (req: Request, res: Response) => {
  const trashcan = await prisma.trashCan.findUnique({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json(trashcan);
});

app.patch("/updatetrashcan/:id", async (req: Request, res: Response) => {
  const trashcan = await prisma.trashCan.update({
    where: {
      id: req.params.id
    },
    data: {
      ...req.body
    }
  });
  res.status(200).json(trashcan);
});

app.delete("/deletetrashcan/:id", async (req: Request, res: Response) => {
  const trashcan = await prisma.trashCan.delete({
    where: {
      id: req.params.id
    }
  });
  res.status(200).json({
    message: "Trashcan deleted successfully",
    trashcan
  });
});
//get all courses
app.get("/getcourses", async (req: Request, res: Response) => {
  const courses = await prisma.courses.findMany();
  res.status(200).json(courses);
});

app.use(errorHandler);
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
});
