"use client";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { submitContactForm } from "@/app/actions/contact";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ContactPage() {
  const { data: session, status: authStatus } = useSession();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  // Pre-fill form when session loads
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(" ") || [""];
      setFormData(previous => ({
        ...previous,
        firstName: previous.firstName || nameParts[0] || "",
        lastName: previous.lastName || nameParts.slice(1).join(" ") || "",
        email: previous.email || session.user.email || "",
      }));
    }
  }, [session]);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
    const params = new URLSearchParams(window.location.search);
    const res = await submitContactForm({ ...formData, topic: params.get("topic") || "", programId: params.get("programId") || "" });
    if (res.success) {
      setStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } else {
      setStatus("error");
      setErrorMessage(res.error || "Something went wrong.");
    }
    } catch { setStatus("error"); setErrorMessage("Your message could not be sent. Please try again or email support@cri.kr."); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-600 mb-12">Whether you have a question about our programs, or are ready to apply, our admissions team is here to guide you.</p>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Email Us</h3>
                <a href="mailto:support@cri.kr" className="text-blue-700 underline">support@cri.kr</a>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Visit Us (Seoul)</h3>
                <p className="text-gray-500">53, Nonhyeon-ro 153-gil<br />Gangnam-gu, Seoul, Republic of Korea</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.04)]">
          
          {status === "success" ? (
            <div role="status" className="text-center py-12">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Message Sent!</h3>
              <p className="text-gray-600 mb-8">Thank you for reaching out. Your inquiry has been received by the admissions team. We will reply to the email address you provided. If you need to add information, email support@cri.kr.</p>
              <button onClick={() => setStatus("idle")} className="text-blue-600 font-bold hover:underline">Send another message</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Send us a message</h3>
                {session?.user && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                    Signed in as {session.user.email}
                  </span>
                )}
              </div>
              
              {status === "error" && (
                <div role="alert" className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <form aria-busy={status === "loading"} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-firstName" className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                    <input 
                      required 
                      id="contact-firstName" name="firstName" maxLength={100}
                      value={formData.firstName} 
                      onChange={handleChange} 
                      type="text" 
                      placeholder="First Name"
                      className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-lastName" className="block text-sm font-bold text-gray-700 mb-2">Last Name (optional)</label>
                    <input 
                      id="contact-lastName" name="lastName" maxLength={100}
                      value={formData.lastName} 
                      onChange={handleChange} 
                      type="text" 
                      placeholder="Last Name"
                      className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                  <input 
                    required 
                    id="contact-email" name="email" maxLength={254}
                    value={formData.email} 
                    onChange={handleChange} 
                    type="email" 
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-2">How can we help? *</label>
                  <textarea 
                    required 
                    id="contact-message" name="message" maxLength={5000}
                    value={formData.message} 
                    onChange={handleChange} 
                    rows={4} 
                    placeholder="Type your detailed inquiry here..." 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <p className="text-sm text-gray-600">* Required. We use your contact details and message to respond to this inquiry. Do not include passwords, payment card details or identity documents. <Link href="/privacy" className="underline text-blue-700">Privacy information</Link></p>
                <button 
                  disabled={status === "loading"} 
                  type="submit" 
                  className="w-full py-4 text-white bg-black hover:bg-gray-900 font-bold rounded-xl transition-all shadow-md disabled:opacity-70 flex justify-center items-center cursor-pointer"
                >
                  {status === "loading" ? "Submitting..." : "Submit Message"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
