import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";
import MessagesClient from "./MessagesClient";
import { checkHasActiveEnrollments, getAvailableContacts } from "@/app/actions/messages";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // 1. Enrollment Gate (Admins inherently pass this)
  const isEnrolled = await checkHasActiveEnrollments();

  if (!isEnrolled) {
    return (
      <StudentLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] items-center justify-center p-8 text-center animate-in fade-in">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm ring-1 ring-gray-100">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Portal Locked</h2>
          <p className="text-gray-500 max-w-md font-medium leading-relaxed">
            The collaborative messaging portal activates automatically once you are officially enrolled in a CRI program via the Administrative Office.
          </p>
        </div>
      </StudentLayout>
    );
  }

  // 2. Peer Discovery (Only returns same-class users + Admins)
  const contacts = await getAvailableContacts();

  return (
    <StudentLayout>
      <MessagesClient contacts={contacts as any} currentUserId={session.user.id} />
    </StudentLayout>
  );
}
