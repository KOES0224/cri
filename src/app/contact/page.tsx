"use client";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { submitContactForm } from "@/app/actions/contact";
import { trackEvent } from "@/lib/analytics";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/i18n/client";
import { COUNTRY_CODES, countryName } from "@/lib/countries";
import { metaTrack, newEventId } from "@/lib/meta/pixel";

export default function ContactPage() {
  const { data: session, status: authStatus } = useSession();
  const { t, locale } = useT();
  const copy = t.contact;

  const emptyForm = { firstName: "", lastName: "", email: "", message: "", country: "", applicantType: "" };
  const [formData, setFormData] = useState(emptyForm);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
    const params = new URLSearchParams(window.location.search);
    // One id for the browser and server copies of the Lead event, so Meta deduplicates them.
    const eventId = newEventId();
    const res = await submitContactForm({ ...formData, country: formData.country as (typeof COUNTRY_CODES)[number], applicantType: formData.applicantType as "parent" | "student" | "other", eventId, topic: params.get("topic") || "", programId: params.get("programId") || "" });
    if (res.success) {
      setStatus("success");
      trackEvent("contact_submitted", { topic: params.get("topic") || undefined, program_id: params.get("programId") || undefined, applicant_type: formData.applicantType, country: formData.country });
      metaTrack("Lead", res.tracking, eventId);
      setFormData(emptyForm);
    } else {
      setStatus("error");
      setErrorMessage(res.error || copy.genericError);
    }
    } catch { setStatus("error"); setErrorMessage(copy.sendError); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-6">{copy.title}</h1>
          <p className="text-xl text-gray-600 mb-12">{copy.intro}</p>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{copy.emailUs}</h3>
                <a href="mailto:support@cri.kr" className="text-blue-700 underline">support@cri.kr</a>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-6 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{copy.visitUs}</h3>
                <p className="text-gray-500">{copy.address1}<br />{copy.address2}</p>
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
              <h3 className="text-3xl font-bold text-gray-900 mb-4">{copy.sentTitle}</h3>
              <p className="text-gray-600 mb-8">{copy.sentBody}</p>
              <button onClick={() => setStatus("idle")} className="text-blue-600 font-bold hover:underline">{copy.sendAnother}</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{copy.sendHeading}</h3>
                {session?.user && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                    {copy.signedInAs(session.user.email ?? "")}
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
                    <label htmlFor="contact-firstName" className="block text-sm font-bold text-gray-700 mb-2">{copy.firstName}</label>
                    <input 
                      required 
                      id="contact-firstName" name="firstName" maxLength={100}
                      value={formData.firstName} 
                      onChange={handleChange} 
                      type="text" 
                      placeholder={copy.firstNamePlaceholder}
                      className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-lastName" className="block text-sm font-bold text-gray-700 mb-2">{copy.lastName}</label>
                    <input 
                      id="contact-lastName" name="lastName" maxLength={100}
                      value={formData.lastName} 
                      onChange={handleChange} 
                      type="text" 
                      placeholder={copy.lastNamePlaceholder}
                      className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-2">{copy.email}</label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-country" className="block text-sm font-bold text-gray-700 mb-2">{copy.country}</label>
                    <select
                      required
                      id="contact-country" name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">{copy.countryPlaceholder}</option>
                      {COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryName(code, locale)}</option>)}
                    </select>
                  </div>
                  <fieldset>
                    <legend className="block text-sm font-bold text-gray-700 mb-2">{copy.applicantType}</legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                      {([["parent", copy.applicantParent], ["student", copy.applicantStudent], ["other", copy.applicantOther]] as const).map(([value, label]) => (
                        <label key={value} className="inline-flex items-center gap-2 text-sm text-gray-800">
                          <input required type="radio" name="applicantType" value={value} checked={formData.applicantType === value} onChange={handleChange} className="h-4 w-4 accent-blue-600" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-2">{copy.message}</label>
                  <textarea 
                    required 
                    id="contact-message" name="message" maxLength={5000}
                    value={formData.message} 
                    onChange={handleChange} 
                    rows={4} 
                    placeholder={copy.messagePlaceholder} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <p className="text-sm text-gray-600">{copy.requiredNote}<Link href="/privacy" className="underline text-blue-700">{copy.privacyLink}</Link></p>
                <p className="text-xs text-gray-500">{copy.adsNote}</p>
                <button 
                  disabled={status === "loading"} 
                  type="submit" 
                  className="w-full py-4 text-white bg-black hover:bg-gray-900 font-bold rounded-xl transition-all shadow-md disabled:opacity-70 flex justify-center items-center cursor-pointer"
                >
                  {status === "loading" ? copy.submitting : copy.submit}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
