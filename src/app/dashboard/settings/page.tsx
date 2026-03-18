import AdminLayout from "../_components/AdminLayout";
import { Settings, Save } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <Settings className="h-5 w-5 mr-2 text-gray-600" />
               Portal Settings
             </h3>
             <p className="text-sm text-gray-500 mt-1">Configure global application preferences.</p>
           </div>
           
           <button className="flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Save className="h-4 w-4 mr-1.5" />
              Save Changes
           </button>
        </div>
        
        <div className="p-8">
           <div className="max-w-2xl space-y-8">
             {/* General Settings */}
             <section>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">General</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="font-medium text-gray-900">Allow New Registrations</p>
                       <p className="text-sm text-gray-500">Enable or disable open sign-ups for the student portal.</p>
                     </div>
                     <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-500 right-0 transform translate-x-0" checked readOnly/>
                        <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-blue-500 cursor-pointer"></label>
                      </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                     <div>
                       <p className="font-medium text-gray-900">Maintenance Mode</p>
                       <p className="text-sm text-gray-500">Show a "down for maintenance" page to non-admins.</p>
                     </div>
                     <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 left-0" readOnly/>
                        <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                  </div>
                </div>
             </section>
             
             {/* Application Settings */}
             <section>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Applications</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Application Status</label>
                    <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                      <option>Pending Review</option>
                      <option>Under Consideration</option>
                      <option>Waitlisted</option>
                    </select>
                  </div>
                </div>
             </section>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
