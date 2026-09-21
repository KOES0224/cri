import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, ExternalLink, CheckCircle2, ChevronRight, XCircle, AlertCircle } from "lucide-react";
import { applicationLabels } from '@/lib/application-validation';
import StudentLayout from "../_components/StudentLayout";
import ParentLayout from "../_components/ParentLayout";
import { canApply } from "@/lib/applicant";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !canApply(session.user.role)) {
    redirect("/dashboard");
  }
  // Parents see the same application tracker inside their own portal shell.
  const Layout = session.user.role === "PARENT" ? ParentLayout : StudentLayout;

  // Fetch applications from Prisma natively
  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: { 
      program: true,
      steps: { orderBy: { order: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const drafts = await prisma.applicationDraft.findMany({where:{userId:session.user.id},orderBy:{updatedAt:'desc'}});
  const draftPrograms = await prisma.program.findMany({where:{id:{in:drafts.map(d=>d.programId)}},select:{id:true,title:true}});
  return (
    <Layout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <FileText className="h-5 w-5 mr-2 text-orange-600" />
               My Applications
             </h3>
             <p className="text-sm text-gray-500 mt-1">{session.user.role === "PARENT" ? "Track the research program applications you submitted for your student." : "Track the status of your research program applications."}</p>
           </div>
        </div>
        
        <div className="p-5 sm:p-8">
           {drafts.length > 0 && <section className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-5"><h4 className="font-semibold text-gray-900">Saved drafts</h4><p className="mt-1 text-sm text-gray-600">Drafts have not been submitted and do not reserve a place.</p><ul className="mt-4 space-y-3">{drafts.map(draft=><li key={draft.id}><Link href={`/apply?programId=${encodeURIComponent(draft.programId)}`} className="text-blue-700 underline">Continue {draftPrograms.find(p=>p.id===draft.programId)?.title || 'application'}</Link><span className="ml-2 text-xs text-gray-500">Updated {draft.updatedAt.toLocaleDateString('en-US')}</span></li>)}</ul></section>}

           {applications.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <Clock className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium">No Applications Yet</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">{session.user.role === "PARENT" ? "No applications have been submitted from this account yet. Browse the programs to apply for your student." : "You haven't applied to any CRI research programs. Browse our offerings to find a mentor matching your interests."}</p>
                <Link href="/research" className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Explore Programs
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
             </div>
           ) : (
             <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
               <ul role="list" className="divide-y divide-gray-100">
                 {applications.map((app) => (
                   <li key={app.id} className="p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                       <div>
                         <h4 className="text-lg font-bold text-gray-900">{app.program?.title || "Application"}</h4>
                         <p className="text-sm text-gray-500 mt-1">Submitted on {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown Date"}</p>
                       </div>
                       <div className="mt-4 md:mt-0">
                         {app.status === 'ACCEPTED' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                             <CheckCircle2 className="w-4 h-4 mr-1.5" /> {app.stage === "ENROLLED" ? "Registered" : "Accepted · registration pending"}
                           </span>
                         )}
                         {app.status === 'REJECTED' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                             <XCircle className="w-4 h-4 mr-1.5" /> Declined
                           </span>
                         )}
                         {app.status === 'PENDING' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                             <AlertCircle className="w-4 h-4 mr-1.5" /> Under Review
                           </span>
                         )}
                       </div>
                     </div>

                     {app.status === 'ACCEPTED' && app.stage !== 'ENROLLED' && <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">You have been accepted. Complete the tuition and registration arrangements provided by admissions to confirm your place. <Link href="/dashboard/messages" className="underline">Open messages</Link></p>}
                     {(() => {
                       let submitted: Record<string, unknown> = {};
                       try { const parsed = JSON.parse(app.content || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) submitted = parsed; } catch {}
                       const payment = submitted.payment as {receiptUrl?: string;amount?:number;currency?:string} | undefined;
                       let receipt: string | null = null;
                       try { const url = new URL(payment?.receiptUrl || ''); if (url.protocol === 'https:' && (url.hostname === 'tosspayments.com' || url.hostname.endsWith('.tosspayments.com'))) receipt = url.href; } catch {}
                       return <details className="mt-5 rounded-xl border border-gray-200 p-4"><summary className="cursor-pointer font-semibold text-gray-900">Submitted application and payment</summary><dl className="mt-4 space-y-4">{Object.entries(applicationLabels).filter(([key])=>typeof submitted[key] === 'string' && submitted[key]).map(([key,label])=><div key={key}><dt className="text-xs font-semibold text-gray-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{key === 'resumeUrl' ? /^\/api\/documents\/[a-z0-9]+$/.test(String(submitted[key])) ? <a href={String(submitted[key])} className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">View private PDF</a> : 'Contact admissions for this document.' : String(submitted[key])}</dd></div>)}</dl>{typeof payment?.amount === 'number' && <p className="mt-5 text-sm">Application fee paid: {payment.amount.toLocaleString()} {payment.currency}</p>}{receipt && <a href={receipt} className="mt-3 inline-block text-sm text-blue-700 underline" target="_blank" rel="noopener noreferrer">View payment receipt</a>}</details>;
                     })()}
                     {/* Visual Tracker / Application Timeline */}
                     <div className="mt-8">
                       {app.steps && app.steps.length > 0 ? (
                         <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                           {app.steps.map((step: any, idx: number) => {
                              const isCompleted = step.status === 'COMPLETED';
                              const isInProgress = step.status === 'IN_PROGRESS';
                              const isWaived = step.status === 'WAIVED';
                              
                              return (
                                <div key={step.id} className="relative pl-6">
                                  {isCompleted ? (
                                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
                                      <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                  ) : isInProgress ? (
                                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    </div>
                                  ) : isWaived ? (
                                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center" />
                                  ) : (
                                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-gray-100 border-4 border-white flex items-center justify-center" />
                                  )}
                                  
                                  <div>
                                    <h5 className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : isInProgress ? 'text-blue-700' : isWaived ? 'text-gray-500 line-through' : 'text-gray-500'}`}>
                                      {step.title}
                                    </h5>
                                    {step.description && (
                                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                                    )}
                                    <div className="flex items-center space-x-2 mt-1.5">
                                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isCompleted ? 'text-green-600' : isInProgress ? 'text-blue-600' : isWaived ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isWaived ? 'Waived' : 'Upcoming'}
                                      </span>
                                      {step.date && (
                                        <span className="text-[11px] text-gray-400">· {new Date(step.date).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                           })}
                         </div>
                       ) : (
                         <div className="relative pt-4">
                           <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                             <div style={{ width: app.status === 'ACCEPTED' ? '100%' : app.status === 'REJECTED' ? '100%' : `${(app.step / 3) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${app.status === 'ACCEPTED' ? 'bg-green-500' : app.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                           </div>
                           <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                              <span className={`${app.step >= 1 ? 'text-blue-600 font-bold' : ''}`}>Received</span>
                              <span className={`text-center ${app.step >= 2 ? 'text-blue-600 font-bold' : ''}`}>Interview</span>
                              <span className={`text-right ${app.status === 'ACCEPTED' ? 'text-green-600 font-bold' : app.status === 'REJECTED' ? 'text-red-600 font-bold' : app.step >= 3 ? 'text-blue-600 font-bold' : ''}`}>Decision</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
