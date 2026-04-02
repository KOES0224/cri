"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as xlsx from "xlsx";

export async function importProfessors(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access: Admins only." };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file was uploaded." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the Excel file
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array
    // raw: false ensures cells formatted as dates/times etc come through as strings
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return { success: false, error: "The Excel file is empty or formatted incorrectly." };
    }

    let successCount = 0;

    // Loop through the data and upsert
    for (const row of rawData) {
      const rowData = row as Record<string, string>;
      
      const name = rowData["Name"] || rowData["name"] || rowData["Professor Name"];
      
      if (!name) continue; // Skip rows without name

      const role = rowData["Role"] || rowData["role"] || rowData["Job Title"] || "Faculty";
      const university = rowData["University"] || rowData["university"] || "";
      const bio = rowData["Bio"] || rowData["bio"] || rowData["Biography"] || "No biography provided.";
      
      const courseTitle = rowData["Course Title"] || rowData["Course"] || "";
      const courseDescription = rowData["Course Description"] || rowData["Syllabus"] || "";
      const teachingHoursProf = rowData["Prof Hours"] || rowData["Professor Teaching Hours"] || rowData["teachingHoursProf"] || "";
      const teachingHoursTA = rowData["TA Hours"] || rowData["TA Teaching Hours"] || rowData["teachingHoursTA"] || "";
      const courseSchedule = rowData["Schedule"] || rowData["Course Schedule"] || rowData["courseSchedule"] || "";

      await prisma.professor.create({
        data: {
          name: name.toString().trim(),
          role: role.toString().trim(),
          university: university.toString().trim() || null,
          bio: bio.toString().trim(),
          acceptingMentees: true,
          publications: 0,
          courseTitle: courseTitle.toString().trim() || null,
          courseDescription: courseDescription.toString().trim() || null,
          teachingHoursProf: teachingHoursProf.toString().trim() || null,
          teachingHoursTA: teachingHoursTA.toString().trim() || null,
          courseSchedule: courseSchedule.toString().trim() || null,
        }
      });
      successCount++;
    }

    revalidatePath("/dashboard/cms/professors");
    revalidatePath("/professors");

    return { success: true, message: `Successfully imported ${successCount} professors.` };
  } catch (error: any) {
    console.error("Bulk upload failed:", error);
    return { success: false, error: error.message || "Failed to process the Excel file." };
  }
}
