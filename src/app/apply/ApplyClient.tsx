"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitApplication } from "@/app/actions/application";
import { BookOpen, Send, User, ChevronLeft, ChevronRight, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

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
    window.scrollTo(0, 0);
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError("");
     
     const res = await submitApplication(program.id, JSON.stringify(formData));
     
     if (res.error) {
       setError(res.error);
       setLoading(false);
     } else {
       router.push("/dashboard/applications");
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
         
         {/* Progress Bar */}
         <div className="mb-8 flex justify-between items-center relative">
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
           <div 
             className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500" 
             style={{ width: `${((step - 1) / 2) * 100}%` }}
           ></div>
           
           <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-200 text-gray-500'}`}>1</div>
           <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>2</div>
           <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>3</div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
            
            {section1(step, nextStep)}
            
            {section2(step, formData, handleChange, nextStep, prevStep)}

            {section3(step, formData, handleChange, handleFileUpload, uploadingResume, handleSubmit, loading, error, prevStep, professors)}

         </div>
      </div>
    </div>
  );
}

function section1(step: number, nextStep: () => void) {
  if (step !== 1) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <button onClick={nextStep} className="w-full h-14 bg-black text-white hover:bg-gray-800 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl">
        Begin Application <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
}

function section2(step: number, formData: any, handleChange: any, nextStep: () => void, prevStep: () => void) {
  if (step !== 2) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-black text-gray-900 mb-2">Personal Information</h2>
      <p className="text-gray-500 text-sm mb-8">This section serves as a comprehensive overview of your academic background and personal details.</p>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's First Name *</label>
            <input type="text" name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Last Name *</label>
            <input type="text" name="studentLastName" value={formData.studentLastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">T-Shirt Size *</label>
            <select name="tShirtSize" value={formData.tShirtSize} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white">
              <option value="">Select...</option>
              <option value="XXS">XXS</option><option value="XS">XS</option><option value="S">S</option>
              <option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Email *</label>
            <input type="email" name="studentEmail" value={formData.studentEmail} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student's Phone / Kakao ID *</label>
            <input type="text" name="studentPhone" value={formData.studentPhone} onChange={handleChange} required placeholder="e.g. +82 10-1234-5678" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
        </div>

        <hr className="border-gray-100 my-6" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's First Name *</label>
            <input type="text" name="parentFirstName" value={formData.parentFirstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Last Name *</label>
            <input type="text" name="parentLastName" value={formData.parentLastName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Email *</label>
            <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Parent's Phone *</label>
            <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
          </div>
        </div>

        <hr className="border-gray-100 my-6" />

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">School/Institution *</label>
          <input type="text" name="school" value={formData.school} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expected Grad Year *</label>
            <select name="gradYear" value={formData.gradYear} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white">
              <option value="">Select...</option>
              <option value="2026">2026</option><option value="2027">2027</option>
              <option value="2028">2028</option><option value="2029">2029</option>
              <option value="2030">2030</option><option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Photo/Video Consent *</label>
            <select name="photoConsent" value={formData.photoConsent} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white">
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="w-1/3 h-14 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center transition-all">
          Back
        </button>
        <button onClick={nextStep} 
          disabled={!formData.studentFirstName || !formData.studentEmail || !formData.school}
          className="w-2/3 h-14 bg-black text-white disabled:bg-gray-400 hover:bg-gray-800 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl">
          Next Step <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

function section3(step: number, formData: any, handleChange: any, handleFileUpload: any, uploadingResume: boolean, handleSubmit: any, loading: boolean, error: string, prevStep: () => void, professors: any[]) {
  if (step !== 3) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-black text-gray-900 mb-2">Research Interest</h2>
      <p className="text-gray-500 text-sm mb-8">This section aims to understand your specific research interests and preferences for research advisors.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Resume Upload (PDF Only) *</label>
          <div className="w-full p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required={!formData.resumeUrl} />
            <div className="flex flex-col items-center justify-center">
              {uploadingResume ? (
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
              ) : formData.resumeUrl ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                  <span className="text-sm font-bold text-green-700">Resume Uploaded Successfully!</span>
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
           <textarea name="initialTopicIdeas" rows={3} value={formData.initialTopicIdeas} onChange={handleChange} required placeholder="Briefly describe your areas of interest..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Primary Area of Interest *</label>
           <input type="text" name="areaOfInterest" value={formData.areaOfInterest} onChange={handleChange} required placeholder="e.g. Computer Science, Molecular Biology" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Essay: Why are you interested? (Max 500w) *</label>
           <textarea name="essay" rows={5} value={formData.essay} onChange={handleChange} required placeholder="Highlight relevant experiences or aspirations..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none" />
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Short Answer: Goals Alignment (Max 150w) *</label>
           <textarea name="shortAnswer" rows={3} value={formData.shortAnswer} onChange={handleChange} required placeholder="How does this align with your professional goals?" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none" />
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
          <h3 className="font-bold text-blue-900 mb-2">Professor Preferences</h3>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">First Choice *</label>
            <select name="firstChoiceProfessor" value={formData.firstChoiceProfessor} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm">
              <option value="">Select First Choice...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">Second Choice *</label>
            <select name="secondChoiceProfessor" value={formData.secondChoiceProfessor} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm">
              <option value="">Select Second Choice...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-800 mb-1">Third Choice *</label>
            <select name="thirdChoiceProfessor" value={formData.thirdChoiceProfessor} onChange={handleChange} required className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm">
              <option value="">Select Third Choice...</option>
              {professors.map((p: any) => <option key={p.id} value={p.name}>{p.name} ({p.university}, {p.role})</option>)}
            </select>
          </div>
          {professors.length === 0 && <p className="text-xs text-red-500 font-medium">No professors are currently assigned to this program.</p>}
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Past Research Experience *</label>
           <textarea name="previousResearch" rows={3} value={formData.previousResearch} onChange={handleChange} required placeholder="If yes, briefly describe contributions..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">How did you learn about this program? *</label>
          <select name="howLearned" value={formData.howLearned} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 transition-all outline-none bg-white">
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

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={prevStep} className="w-1/3 h-14 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center transition-all">
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !formData.resumeUrl}
            className="w-2/3 h-14 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? "Submitting..." : <>Submit Application <Send className="w-5 h-5 ml-2" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
