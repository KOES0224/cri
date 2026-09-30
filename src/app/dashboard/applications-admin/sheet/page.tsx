import { redirect } from "next/navigation";

/** The spreadsheet moved to a full-screen page outside the admin shell. */
export default function SpreadsheetPage() {
  redirect("/admin/applications-sheet");
}
