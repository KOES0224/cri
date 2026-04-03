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

  const researchStr = row["Research Areas"] || "";
  const keywordsStr = row["Keywords"] || "";
  const university = (row["University"] || "a prestigious institution").trim();
  const title = (row["Title"] || "Leading Academic").trim();

  // 1. Course Title & Major Base
  const prefixes = [
    "Frontiers in", "Advanced Seminar:", "Foundations of", 
    "Directed Research:", "Advanced Studies in", "Innovations in", 
    "Contemporary Topics in", "Quantitative Analysis of", "Explorations in"
  ];
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let extractedMajor = "Interdisciplinary Studies";
  
  if (keywordsStr) {
    extractedMajor = keywordsStr.split(",")[0].trim();
  } else if (researchStr) {
    extractedMajor = researchStr.split(",")[0].trim();
  }
  const generatedTitle = `${randomPrefix} ${extractedMajor}`;

  // 2. Generate Marketing Bio (If empty)
  let generatedBio = "";
  if (title && university && extractedMajor !== "Interdisciplinary Studies") {
    generatedBio = `${profName} is a distinguished ${title} from ${university}, renowned for their specialized focus in ${extractedMajor}. Their ongoing academic work serves to advance modern methodological approaches and critical innovations within the discipline. Working under their mentorship offers students an exclusive window into top-tier academic research and publishing standards.`;
  } else {
    generatedBio = `${profName} is an elite academic mentor specializing in rigorous, publication-driven research. Students under their guidance will explore cutting-edge concepts and develop an advanced understanding of the material currently debated at the highest levels of academia.`;
  }

  // 3. Generate Course Description (If empty)
  let syllabusParts = [
    row["Course Description"] ? `Course Description:\n${row["Course Description"]}` : "",
    row["Assessment Methods"] ? `Assessment Methods:\n${row["Assessment Methods"]}` : ""
  ].filter(Boolean).join("\n\n");

  if (!syllabusParts.trim()) {
    syllabusParts = `Course Description:\nThis highly selective research curriculum is engineered to challenge ambitious scholars. Throughout the program, students will engage deeply with core methodologies related to ${extractedMajor}. By combining theoretical foundations with practical analysis, participants will develop a publication-ready manuscript that proves their ability to execute rigorous academic inquiry at the university level.`;
  }

  // 4. Generate Ideal Students (If empty)
  let idealStudents = (row["Ideal Students"] || "").trim();
  if (!idealStudents) {
    idealStudents = `Highly motivated high school and undergraduate students with a strong foundational interest in ${extractedMajor}. Applicants should possess strong analytical skills and a drive to produce collegiate-level academic coursework.`;
  }

  // 5. Generate Potential Topics (If empty)
  let potentialTopics = [researchStr, keywordsStr].filter(Boolean).join(" | ").trim();
  if (!potentialTopics) {
    potentialTopics = `Advanced ${extractedMajor} | Methodological Analysis | Contemporary Research Paradigms`;
  }

  // 6. Hard-map 3 Explicit Keywords
  let explicitKeywordsArray = (keywordsStr + "," + researchStr).split(",").map(s => s.trim()).filter(Boolean);
  if (explicitKeywordsArray.length === 0) {
    explicitKeywordsArray = [extractedMajor, "Academic Research", "Methodology"];
  }
  const hardKeywords = explicitKeywordsArray.slice(0, 3).join(", ");

  formattedRows.push({
    "Name": profName.trim(),
    "Role": title,
    "University": university === "a prestigious institution" ? "" : university,
    "Major": extractedMajor,
    "Keywords": hardKeywords,
    "Bio": generatedBio,
    "Course Title": generatedTitle,
    "Course Description": syllabusParts,
    "Ideal Students": idealStudents,
    "Potential Topics": potentialTopics
  });
}

const newSheet = xlsx.utils.json_to_sheet(formattedRows);
const newWorkbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Professors");
xlsx.writeFile(newWorkbook, outputPath);
console.log("Successfully wrote formatted file to: " + outputPath);
