"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Send, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  FileText,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

type ApplyClientProps = {
  program: any;
  user: any;
};

export default function ApplyClient({ program, user }: ApplyClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);

  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentLastName: "",
    gender: "",
    studentEmail: user.email || "",
    tShirtSize: "",
    studentPhone: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    school: "",
    gradYear: "",
    photoConsent: "",
    resumeUrl: "",
    initialTopicIdeas: "",
    areaOfInterest: "",
    essay: "",
    shortAnswer: "",
    firstChoiceProfessor: "",
    secondChoiceProfessor: "",
    thirdChoiceProfessor: "",
    previousResearch: "",
    howLearned: "",
  });

  // Restore draft from sessionStorage if user previously started or returned from payment
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("cri_apply_draft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.programId === program.id && parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
        }
      }
    } catch (e) {
      console.error("Failed to restore application draft:", e);
    }
  }, [program.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.type !== "application/pdf") {
      alert("Please upload your resume in PDF format only.");
      return;
    }

    setUploadingResume(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const blob = await response.json();
      setFormData(prev => ({ ...prev, resumeUrl: blob.url }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(prev => prev - 1);
  };

  // Launch Toss Payments Checkout for the $50 USD Application Fee
  const handleTossCheckout = async () => {
    setLoading(true);
    setError("");

    // Persist form state into sessionStorage before redirecting to Toss checkout
    try {
      sessionStorage.setItem("cri_apply_draft", JSON.stringify({
        programId: program.id,
        formData,
      }));
    } catch (e) {
      console.error("Draft save warning:", e);
    }

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id || "ANONYMOUS" });

      const orderId = `CRI_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const candidateName = `${formData.studentFirstName} ${formData.studentLastName}`.trim() || user.name || "Applicant";

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: 68000, // Equivalent to $50.00 USD at standard rate
        },
        orderId,
        orderName: `${program.title} Application Fee ($50 USD)`,
        successUrl: `${window.location.origin}/apply/payment-success?programId=${program.id}`,
        failUrl: `${window.location.origin}/apply/payment-fail?programId=${program.id}`,
        customerEmail: formData.studentEmail || user.email,
        customerName: candidateName,
      });
    } catch (err: any) {
      console.error("Toss checkout error:", err);
      // If user closed the popup, handle gracefully
      if (err.code === "USER_CANCEL") {
        setError("Payment was cancelled. You can try again whenever you are ready.");
      } else {
        setError(err.message || "Failed to launch payment window. Please try again.");
      }
      setLoading(false);
    }
  };

  const professors = program.professors || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
         <Link href={`/research/program/${program.id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8">
           <ChevronLeft className="w-4 h-4 mr-1" />
           Back to Program Details
         </Link>
         
         {/* Apple-style 4-Step Progress Bar */}
         <div className="mb-8 flex justify-between items-center relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200/80 rounded-full z-0"></div>
           <div 
             className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full z-0 transition-all duration-500 ease-out" 
             style={{ width: `${((step - 1) / 3) * 100}%` }}
           ></div>
           
           {[1, 2, 3, 4].map(s => (
             <div 
               key={s} 
               className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                 step >= s 
                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                   : 'bg-white border-2 border-gray-200 text-gray-400'
               }`}
             >
               {s}
             </div>
           ))}
         </div>

         {/* Form Card */}
         <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100/80 relative overflow-hidden transition-all">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {section1(step, nextStep)}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {section2(step, formData, handleChange, nextStep, prevStep)}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {section3(step, formData, handleChange, handleFileUpload, uploadingResume, nextStep, prevStep, professors)}
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {section4(step, program, formData, user, handleTossCheckout, loading, error, prevStep)}
                </motion.div>
              )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}

// ── Step 1: Program Guidelines & Introduction ──
function section1(step: number, nextStep: () => void) {
  if (step !== 1) return null;
  return (
    <div>
      <div className="flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6 shadow-sm">
        <BookOpen className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">A Journey to Academic Excellence</h1>
      <p className="text-gray-500 mb-8 font-medium leading-relaxed">
        Application Results: Announced within 14 days of submission.
        <br/><br/>
        Please submit your application as early as possible to be considered for the program. Best of luck!
        <br/><br/>
        All applicant responses will be treated with utmost confidentiality, and the information provided will be kept strictly confidential to ensure the privacy and integrity of the application process.
      </p>
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 flex items-start">
         <AlertCircle className="w-6 h-6 text-blue-600 mr-3 shrink-0" />
         <p className="text-sm text-blue-800 font-medium">Contact Number: +82) 02-6203-8999<br/>Email: support@cri.kr</p>
      </div>

      <button onClick={nextStep} className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl cursor-pointer">
        Begin Application <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
}

// ── Step 2: Personal Information ──
function section2(step: number, formData: any, handleChange: any, nextStep: () => void, prevStep: () => void) {
  if (step !== 2) return null;
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Personal Information</h2>
      <p className="text-gray-500 text-sm mb-8">This section serves as a comprehensive overview of your academic background and personal details.</p>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's First Name *</label>
            <input type="text" name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Last Name *</label>
            <input type="text" name="studentLastName" value={formData.studentLastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white font-medium">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">T-Shirt Size *</label>
            <select name="tShirtSize" value={formData.tShirtSize} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white font-medium">
              <option value="">Select...</option>
              <option value="XXS">XXS</option><option value="XS">XS</option><option value="S">S</option>
              <option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Email *</label>
            <input type="email" name="studentEmail" value={formData.studentEmail} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Phone / WhatsApp *</label>
            <input type="text" name="studentPhone" value={formData.studentPhone} onChange={handleChange} required placeholder="e.g. +1 555-0123 / +82 10-1234-5678" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
        </div>

        <hr className="border-gray-100 my-6" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's First Name *</label>
            <input type="text" name="parentFirstName" value={formData.parentFirstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Last Name *</label>
            <input type="text" name="parentLastName" value={formData.parentLastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Email *</label>
            <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Phone *</label>
            <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
          </div>
        </div>

        <hr className="border-gray-100 my-6" />

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">School/Institution *</label>
          <input type="text" name="school" value={formData.school} onChange={handleChange} required placeholder="e.g. Phillips Exeter Academy, Anglo-Chinese School, Seoul Int'l School" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expected Grad Year *</label>
            <select name="gradYear" value={formData.gradYear} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white font-medium">
              <option value="">Select...</option>
              <option value="2026">2026</option><option value="2027">2027</option>
              <option value="2028">2028</option><option value="2029">2029</option>
              <option value="2030">2030</option><option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Photo/Video Consent *</label>
            <select name="photoConsent" value={formData.photoConsent} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white font-medium">
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="w-1/3 h-14 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer">
          Back
        </button>
        <button onClick={nextStep} 
          disabled={!formData.studentFirstName || !formData.studentEmail || !formData.school}
          className="w-2/3 h-14 bg-black text-white disabled:bg-gray-400 hover:bg-gray-800 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl cursor-pointer">
          Next Step <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Academic Proposal & Essays ──
function section3(
  step: number, 
  formData: any, 
  handleChange: any, 
  handleFileUpload: any, 
  uploadingResume: boolean, 
  nextStep: () => void, 
  prevStep: () => void, 
  professors: any[]
) {
  if (step !== 3) return null;
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Research Interest</h2>
      <p className="text-gray-500 text-sm mb-8">This section aims to understand your specific research interests and preferences for research advisors.</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Resume Upload (PDF Only) *</label>
          <div className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!formData.resumeUrl} />
            <div className="flex flex-col items-center justify-center">
              {uploadingResume ? (
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
              ) : formData.resumeUrl ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-sm font-bold text-emerald-700">Resume Uploaded Successfully!</span>
                  <span className="text-xs text-gray-500 mt-1">Click to replace file</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
                  <span className="text-sm font-bold text-gray-700">Click or drag PDF to upload</span>
                  <p className="text-xs text-gray-500 mt-2">Must include your current GPA</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Initial Research Topic Ideas *</label>
           <textarea name="initialTopicIdeas" rows={3} value={formData.initialTopicIdeas} onChange={handleChange} required placeholder="Briefly describe your areas of interest..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none font-medium text-sm" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Primary Area of Interest *</label>
           <input type="text" name="areaOfInterest" value={formData.areaOfInterest} onChange={handleChange} required placeholder="e.g. Computer Science, Artificial Intelligence, Bioengineering" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none font-medium" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Essay: Why are you interested? (Max 500w) *</label>
           <textarea name="essay" rows={5} value={formData.essay} onChange={handleChange} required placeholder="Highlight relevant experiences or aspirations..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none font-medium text-sm" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Short Answer: Goals Alignment (Max 150w) *</label>
           <textarea name="shortAnswer" rows={3} value={formData.shortAnswer} onChange={handleChange} required placeholder="How does this align with your professional goals?" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none font-medium text-sm" />
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
          <h3 className="font-bold text-blue-900 mb-2">Professor Preferences</h3>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">First Choice *</label>
            <select name="firstChoiceProfessor" value={formData.firstChoiceProfessor} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm font-medium">
              <option value="">Select First Choice...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">Second Choice</label>
            <select name="secondChoiceProfessor" value={formData.secondChoiceProfessor} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm font-medium">
              <option value="">Select Second Choice (Optional)...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">Third Choice</label>
            <select name="thirdChoiceProfessor" value={formData.thirdChoiceProfessor} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm font-medium">
              <option value="">Select Third Choice (Optional)...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Past Research Experience *</label>
           <textarea name="previousResearch" rows={3} value={formData.previousResearch} onChange={handleChange} required placeholder="If yes, describe contributions (or write 'None')..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none font-medium text-sm" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">How did you learn about this program? *</label>
          <select name="howLearned" value={formData.howLearned} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white font-medium">
            <option value="">Select...</option>
            <option value="University/College Announcement">University/College Announcement</option>
            <option value="Academic Advisor Recommendation">Academic Advisor Recommendation</option>
            <option value="Online Advertisement">Online Advertisement</option>
            <option value="Social Media">Social Media</option>
            <option value="Referral">Referral from a Current/Past Participant</option>
            <option value="Conference or Event">Conference or Event</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={prevStep} className="w-1/3 h-14 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer">
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={!formData.resumeUrl || !formData.essay || !formData.areaOfInterest || !formData.firstChoiceProfessor}
            className="w-2/3 h-14 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            Review & Payment ($50 USD) <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Review & Payment ($50.00 USD) ──
function section4(
  step: number,
  program: any,
  formData: any,
  user: any,
  handleTossCheckout: () => void,
  loading: boolean,
  error: string,
  prevStep: () => void
) {
  if (step !== 4) return null;

  const candidateName = `${formData.studentFirstName} ${formData.studentLastName}`.trim() || user.name || "Student";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Review & Application Fee</h2>
          <p className="text-gray-500 text-xs">Verify your dossier and submit the evaluation fee</p>
        </div>
      </div>

      {/* Application Summary Box */}
      <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 space-y-4 my-6">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          Dossier Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">Applicant Name</span>
            <span className="font-bold text-gray-800 text-sm">{candidateName}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Email</span>
            <span className="font-semibold text-gray-800">{formData.studentEmail}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Target Program</span>
            <span className="font-bold text-blue-700">{program.title}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">1st Choice Professor</span>
            <span className="font-semibold text-gray-800">{formData.firstChoiceProfessor || "Not Specified"}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">School & Grad Year</span>
            <span className="font-semibold text-gray-800">{formData.school} (Class of {formData.gradYear})</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Academic Resume</span>
            <span className="font-bold text-emerald-700 inline-flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PDF Attached
            </span>
          </div>
        </div>
      </div>

      {/* Payment Fee Breakdown */}
      <div className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/30 rounded-2xl p-6 border border-blue-100/80 space-y-4 mb-6">
        <div className="flex justify-between items-center pb-4 border-b border-blue-100">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Application & Evaluation Fee</h4>
            <p className="text-xs text-gray-500 mt-0.5">Faculty dossier review, interview scheduling & administrative processing</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">$50.00 <span className="text-xs font-bold text-blue-600">USD</span></div>
            <div className="text-[11px] text-gray-400 font-mono">≈ ₩68,000 KRW</div>
          </div>
        </div>

        {/* Payment Features Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center text-gray-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
            <span>Bank-grade 256-bit encryption</span>
          </div>
          <div className="flex items-center text-gray-600">
            <CreditCard className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
            <span>Visa, MasterCard, Amex & Korean cards</span>
          </div>
          <div className="flex items-center text-gray-600">
            <FileText className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
            <span>Instant official card receipt emailed</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Lock className="w-4 h-4 text-purple-600 mr-2 shrink-0" />
            <span>Direct deposit to corporate bank</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={loading}
          className="w-1/3 h-14 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleTossCheckout}
          disabled={loading}
          className="w-2/3 h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Opening Secure Payment...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Pay $50.00 USD & Submit
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-4">
        By clicking Pay & Submit, you agree to our admissions evaluation terms. 0% VAT applies for overseas applicants.
      </p>
    </div>
  );
}
