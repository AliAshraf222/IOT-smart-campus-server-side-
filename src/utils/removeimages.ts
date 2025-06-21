import fs from "fs";
export function emptyDirectory(directoryPath: string) {
  try {
    // 1. Delete the directory and everything in it.
    // `recursive: true` deletes all subfolders and files.
    // `force: true` prevents an error if the directory doesn't exist.
    fs.rmSync(directoryPath, { recursive: true, force: true });

    // 2. Recreate the empty directory.
    fs.mkdirSync(directoryPath);

    console.log(`Successfully emptied the directory`);
  } catch (err: any) {
    // This will catch errors like permission denied.
    console.error(`Error emptying directory: ${err.message}`);
  }
}
