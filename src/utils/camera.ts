import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// const rtspUrl =`rtsp://${username}:${password}@${camera_ip}:554/stream1`
// const rtspUrl = "rtsp://iotgpcam:abcd0123456789@197.57.188.154:554/stream1";

// Where to save the screenshots

/**
 * Takes a single screenshot from the RTSP stream and saves it to a file.
 * This function is asynchronous and returns a Promise that resolves with the
 * full path to the saved screenshot.
 * @returns {Promise<string>} A promise that resolves with the image path.
 */
export function takeScreenshot(
  username: string,
  password: string,
  camera_ip: string,
  courseid: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(process.cwd(), "screenshots", courseid);
    // First, ensure the output directory exists.
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate a unique filename using the current date and time
    // const rtspUrl = "rtsp://iotgpcam:abcd0123456789@197.57.188.154:554/stream1";
    const rtspUrl = `rtsp://${username}:${password}@${camera_ip}:554/stream1`;
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `screenshot-${timestamp}.jpg`;
    const outputPath = path.join(outputDir, filename);

    console.log(`[${new Date().toLocaleTimeString()}] Taking screenshot...`);

    ffmpeg(rtspUrl)
      .inputOptions("-rtsp_transport", "tcp")
      .frames(1)
      .output(outputPath)
      .duration(15)
      .on("end", () => {
        console.log(`Screenshot saved: ${outputPath}`);
        // When ffmpeg finishes, resolve the promise with the path
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("Error taking screenshot: " + err.message);
        // If an error occurs, reject the promise
        reject(err);
      })
      .run();
  });
}

// takeScreenshot();
