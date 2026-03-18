import ParentLayout from "../_components/ParentLayout";
import { CreditCard, Receipt } from "lucide-react";

export default function BillingPage() {
  return (
    <ParentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <CreditCard className="h-5 w-5 mr-2 text-green-600" />
               Billing & Invoices
             </h3>
             <p className="text-sm text-gray-500 mt-1">View payment history and outstanding invoices.</p>
           </div>
        </div>
        
        <div className="p-8">
           <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
              <Receipt className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-900 font-medium">No Billing History</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">You currently have no outstanding invoices or past payments.</p>
           </div>
        </div>
      </div>
    </ParentLayout>
  );
}
