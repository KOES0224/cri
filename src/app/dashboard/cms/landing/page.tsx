import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "../../_components/AdminLayout";
import LandingClientForm from "./LandingClientForm";

export default async function LandingCMSPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <LandingClientForm />
    </AdminLayout>
  );
}
