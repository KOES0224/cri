import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/app/actions/users";
import AdminLayout from "../_components/AdminLayout";
import AdminUsersList from "../_components/AdminUsersList";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialUsers = await getUsers();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          User Management
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Review, promote, or remove accounts across the portal.
        </p>
      </div>

      <AdminUsersList initialUsers={initialUsers} />
    </AdminLayout>
  );
}
