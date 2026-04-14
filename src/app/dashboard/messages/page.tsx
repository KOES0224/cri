import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lock, MessageSquare } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";
import AdminLayout from "../_components/AdminLayout";
import MessagesClient from "./MessagesClient";
import AdminMessagesClient from "./AdminMessagesClient";
import { checkHasActiveEnrollments, getAvailableContacts } from "@/app/actions/messages";
import { getPrograms } from "@/app/actions/programs";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // 1. Enrollment Gate
  const isEnrolled = await checkHasActiveEnrollments();

  if (!isEnrolled && !isAdmin) {
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

  // 2. Peer Discovery
  const contacts = await getAvailableContacts();

  if (isAdmin) {
    const programs = await getPrograms();
    return (
      <AdminLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600 p-1.5 bg-blue-50 rounded-lg" />
            Global Communications
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Broadcast messages to course groups, search students, or chat individually.
          </p>
        </div>
        <AdminMessagesClient contacts={contacts as any} currentUserId={session.user.id} programs={programs} />
      </AdminLayout>
    );
  }

  return (
    <StudentLayout>
      <MessagesClient contacts={contacts as any} currentUserId={session.user.id} />
    </StudentLayout>
  );
}
