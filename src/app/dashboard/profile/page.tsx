import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import StudentLayout from "../_components/StudentLayout";
import ParentLayout from "../_components/ParentLayout";
import AdminLayout from "../_components/AdminLayout";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email }, 
    include: { accounts: true } 
  });
  
  if (!user) redirect("/auth/login");

  const isGoogle = user.accounts.some(acc => acc.provider === "google");

  const FormComponent = (
    <>
      {role === "STUDENT" && user.studentCode && (
        <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Your student code</p>
            <p className="text-xs text-gray-600 mt-0.5">Give this code to your parent, guardian or agency so they can link their account and follow your programs and feedback.</p>
          </div>
          <span className="font-mono text-2xl font-black tracking-[0.2em] text-purple-800 bg-white border border-purple-200 rounded-xl px-4 py-2 select-all">{user.studentCode}</span>
        </div>
      )}
      <ProfileForm user={{ name: user.name || "", email: user.email, isGoogle }} />
    </>
  );

  if (role === "ADMIN") {
    return <AdminLayout>{FormComponent}</AdminLayout>;
  } else if (role === "PARENT") {
    return <ParentLayout>{FormComponent}</ParentLayout>;
  } else {
    // Default to student
    return <StudentLayout>{FormComponent}</StudentLayout>;
  }
}
