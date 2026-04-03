const fs = require('fs');
const xlsx = require('xlsx');

const inputPath = '/Users/eunsolko/Downloads/Private & Shared/Professor Database 2debaac41f9881ebb9f4c81f62b26a15.csv';
const outputPath = '/Users/eunsolko/Downloads/Formatted_Professors_For_Upload.xlsx';

const workbook = xlsx.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

const formattedRows = [];

for (const row of data) {
  const profName = row["Professor Name"];
  if (!profName || profName.trim() === "" || profName.includes("Faculty Introduction")) continue;

  const bioParts = [
    row["Work Experience"] ? `Work Experience:\n${row["Work Experience"]}` : ""
  ].filter(Boolean).join("\n\n");
  
  const researchStr = row["Research Areas"] || "";
  const keywordsStr = row["Keywords"] || "";

  const syllabusParts = [
    row["Course Description"] ? `Course Description:\n${row["Course Description"]}` : "",
    row["Assessment Methods"] ? `Assessment Methods:\n${row["Assessment Methods"]}` : ""
  ].filter(Boolean).join("\n\n");
  
  // Generate a dynamic course title based on research/keywords
  let generatedTitle = "Advanced Research Mentorship";
  if (keywordsStr) {
    const firstKeyword = keywordsStr.split(",")[0].trim();
    generatedTitle = `Advanced Research in ${firstKeyword}`;
  } else if (researchStr) {
    const firstArea = researchStr.split(",")[0].trim();
    generatedTitle = `Advanced Topics in ${firstArea}`;
  }

  // Generate potential topics string
  const potentialTopics = [researchStr, keywordsStr].filter(Boolean).join(" | ");

  formattedRows.push({
    "Name": profName.trim(),
    "Role": (row["Title"] || "").trim(),
    "University": (row["University"] || "").trim(),
    "Bio": bioParts.trim() || "-",
    "Course Title": generatedTitle,
    "Course Description": syllabusParts.trim(),
    "Ideal Students": (row["Ideal Students"] || "").trim(),
    "Potential Topics": potentialTopics.trim()
  });
}

const newSheet = xlsx.utils.json_to_sheet(formattedRows);
const newWorkbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Professors");
xlsx.writeFile(newWorkbook, outputPath);
console.log("Successfully wrote formatted file to: " + outputPath);
