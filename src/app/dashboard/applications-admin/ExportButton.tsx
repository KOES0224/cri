"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { getAdminApplicationsExportData } from "@/app/actions/adminApplications";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await getAdminApplicationsExportData();
      if (!res.success || !res.data) {
        alert("Failed to export data: " + (res.error || "Unknown error"));
        setLoading(false);
        return;
      }

      const applications = res.data;

      // Prepare headers
      const csvData = [];
      const headers = [
        "Applicant Name",
        "Applicant Email",
        "Student Code",
        "Program Title",
        "Category",
        "Status",
        "Submitted At",
        // Form Fields (Extracted from content)
        "First Name",
        "Last Name",
        "Gender",
        "Student Phone",
        "Parent First Name",
        "Parent Last Name",
        "Parent Email",
        "Parent Phone",
        "School",
        "Grad Year",
        "Area of Interest",
        "Initial Topic Ideas",
        "Essay",
        "Short Answer",
        "First Choice Prof",
        "Second Choice Prof",
        "Third Choice Prof",
        "Previous Research",
        "How Learned",
        "Resume URL",
        "Admin Comments"
      ];
      csvData.push(headers.join(","));

      const escapeCSV = (str: string | null | undefined) => {
        if (!str) return '""';
        // Replace quotes with double quotes and wrap in quotes
        return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      applications.forEach((app: any) => {
        let contentObj: any = {};
        try {
          contentObj = JSON.parse(app.content || "{}");
        } catch(e) {}

        const comments = (app.user?.activities || [])
          .filter((a: any) => a.action === "NOTE_ADDED")
          .map((a: any) => `[${new Date(a.createdAt).toLocaleDateString()}] ${a.adminName}: ${a.content}`)
          .join(" | ");

        const row = [
          escapeCSV(app.user?.name),
          escapeCSV(app.user?.email),
          escapeCSV(app.user?.studentCode),
          escapeCSV(app.program?.title),
          escapeCSV(app.program?.category),
          escapeCSV(app.status),
          escapeCSV(new Date(app.createdAt).toLocaleString()),
          
          escapeCSV(contentObj.studentFirstName),
          escapeCSV(contentObj.studentLastName),
          escapeCSV(contentObj.gender),
          escapeCSV(contentObj.studentPhone),
          escapeCSV(contentObj.parentFirstName),
          escapeCSV(contentObj.parentLastName),
          escapeCSV(contentObj.parentEmail),
          escapeCSV(contentObj.parentPhone),
          escapeCSV(contentObj.school),
          escapeCSV(contentObj.gradYear),
          escapeCSV(contentObj.areaOfInterest),
          escapeCSV(contentObj.initialTopicIdeas),
          escapeCSV(contentObj.essay),
          escapeCSV(contentObj.shortAnswer),
          escapeCSV(contentObj.firstChoiceProfessor),
          escapeCSV(contentObj.secondChoiceProfessor),
          escapeCSV(contentObj.thirdChoiceProfessor),
          escapeCSV(contentObj.previousResearch),
          escapeCSV(contentObj.howLearned),
          escapeCSV(contentObj.resumeUrl),
          escapeCSV(comments)
        ];
        
        csvData.push(row.join(","));
      });

      const csvString = csvData.join("\n");
      // Add BOM to fix UTF-8 in Excel
      const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Applications_Export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert("An error occurred during export.");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-green-600/20 disabled:opacity-50"
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? "Exporting..." : "Export to Excel"}
    </button>
  );
}
