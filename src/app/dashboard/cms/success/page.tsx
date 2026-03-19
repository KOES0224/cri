import AdminLayout from "../../_components/AdminLayout";
import { getSuccessStories } from "@/app/actions/success";
import AdminSuccessList from "../../_components/AdminSuccessList";

export default async function AdminSuccessCMS() {
  const stories = await getSuccessStories();
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Student Success CMS</h1>
        <p className="mt-1 text-sm text-gray-500">Manage alumni placements and publish new success stories.</p>
      </div>

      <AdminSuccessList initialStories={stories} />
    </AdminLayout>
  );
}
