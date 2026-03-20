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
      setFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: session.user.email || "",
        message: "",
      });
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

    const res = await submitContactForm(formData);
    if (res.success) {
      setStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } else {
      setStatus("error");
      setErrorMessage(res.error || "Something went wrong.");
    }
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
                <p className="text-gray-500">admissions@cri.kr</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Visit Us (Seoul)</h3>
                <p className="text-gray-500">1 Gwanak-ro, Gwanak-gu<br />Seoul, South Korea 08826</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.04)]">
          
          {authStatus === "loading" ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : authStatus === "unauthenticated" ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Sign in to send an inquiry</h3>
              <p className="text-gray-500 mb-8">To ensure the highest quality of service, we require users to authenticate before contacting our admissions board.</p>
              <Link href="/auth/login?callbackUrl=/contact" className="inline-flex w-full justify-center items-center py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                Sign In or Create Account
              </Link>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Message Sent!</h3>
              <p className="text-gray-600 mb-8">Thank you for reaching out. Our admissions board will review your inquiry and get back to you shortly.</p>
              <button onClick={() => setStatus("idle")} className="text-blue-600 font-bold hover:underline">Send another message</button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-8">Send us a message</h3>
              
              {status === "error" && (
                <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                    <input required disabled name="firstName" value={formData.firstName} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-gray-50/50 text-gray-500 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                    <input name="lastName" disabled value={formData.lastName} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-gray-50/50 text-gray-500 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input required disabled name="email" value={formData.email} onChange={handleChange} type="email" className="w-full px-4 py-3 bg-gray-50/50 text-gray-500 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">How can we help?</label>
                  <textarea required name="message" value={formData.message} onChange={handleChange} rows={4} placeholder="Type your detailed inquiry here..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"></textarea>
                </div>
                <button disabled={status === "loading"} type="submit" className="w-full py-4 text-white bg-black hover:bg-gray-900 font-bold rounded-xl transition-all shadow-md disabled:opacity-70 flex justify-center items-center">
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
