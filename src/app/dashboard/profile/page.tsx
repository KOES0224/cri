import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  const FormComponent = <ProfileForm user={{ name: user.name || "", email: user.email, isGoogle }} />;

  if (role === "ADMIN") {
    return <AdminLayout>{FormComponent}</AdminLayout>;
  } else if (role === "PARENT") {
    return <ParentLayout>{FormComponent}</ParentLayout>;
  } else {
    // Default to student
    return <StudentLayout>{FormComponent}</StudentLayout>;
  }
}
