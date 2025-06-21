import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

/**
 * Updates an Excel sheet, adding only users who do not already exist in the sheet.
 * It checks existing 'Student ID's before appending new rows.
 *
 * @param usersObject A JavaScript object where keys are user IDs and values are user names.
 */
export const updateAttendanceWithSheetJS = async (
  usersObject: {
    [key: string]: string;
  },
  courseid: string
) => {
  const filePath = path.join(
    process.cwd(),
    "sheets",
    courseid,
    "attendance.xlsx"
  );
  const sheetName = "Attendance";

  try {
    let workbook: XLSX.WorkBook;

    // --- Part 1: Load or Create the Workbook ---
    if (fs.existsSync(filePath)) {
      workbook = XLSX.readFile(filePath);
    } else {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      workbook = XLSX.utils.book_new();
    }

    let worksheet = workbook.Sheets[sheetName];
    const usersToAdd: { [key: string]: string } = {};

    // --- Part 2: Check for Existing Users (The New Logic) ---
    if (worksheet) {
      // Convert the sheet to an array of objects. The keys will be the header names.
      const existingData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // Create a Set for fast lookup of existing IDs.
      // We convert IDs to strings to ensure consistent matching.
      const existingIds = new Set<string>(
        existingData.map((row) => String(row["Student ID"]))
      );

      // Filter the incoming usersObject to find only the new users.
      for (const newId in usersObject) {
        if (existingIds.has(newId)) {
          // If the ID already exists, skip it.
        } else {
          // If the ID is new, add it to our list of users to add.
          usersToAdd[newId] = usersObject[newId];
        }
      }
    } else {
      Object.assign(usersToAdd, usersObject);
    }

    const newRows = Object.keys(usersToAdd).map((id) => [
      id,
      usersToAdd[id],
      new Date().toLocaleString()
    ]);

    if (newRows.length === 0) {
      return;
    }

    // If the worksheet was brand new, we need to create it and add headers.
    if (!worksheet) {
      const dataWithHeaders = [
        ["Student ID", "Student Name", "Timestamp"],
        ...newRows
      ];
      worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else {
      // Otherwise, just append the new (filtered) rows to the existing sheet.
      XLSX.utils.sheet_add_aoa(worksheet, newRows, { origin: -1 });
    }

    // Write the updated file to disk.
    XLSX.writeFile(workbook, filePath);
  } catch (error: any) {
    console.error("[ERROR with sheetjs] Failed to update Excel sheet!");
    if (error.code === "EBUSY") {
      console.error(
        "CRITICAL: The file is locked! Please close attendance.xlsx and try again."
      );
    } else {
      console.error(error);
    }
  }
};

export function deleteFile(filePath: string) {
  try {
    // fs.unlinkSync synchronously deletes the file.
    fs.unlinkSync(filePath);
    console.log(`Successfully deleted: ${filePath}`);
  } catch (err: any) {
    // Check for specific, common errors
    if (err.code === "ENOENT") {
      console.error(`Error: The file was not found at '${filePath}'`);
    } else if (err.code === "EPERM") {
      console.error(
        `Error: You do not have permission to delete '${filePath}'`
      );
    } else {
      // Handle any other unexpected errors
      console.error(`An unexpected error occurred: ${err.message}`);
    }
  }
}
