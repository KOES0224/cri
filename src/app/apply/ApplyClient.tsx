'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { beginApplicationCheckout } from '@/app/actions/payment';
import { saveApplicationDraft } from '@/app/actions/applicationDrafts';
import { applicationErrors, applicationLabels, personalFields } from '@/lib/application-validation';
import { APPLICATION_CHARGE_LABEL } from '@/lib/application-fee';
import { programKind } from '@/lib/program-policy';

type Program = { id: string; title: string; category: string; tuition: number | null; professors: { id: string; name: string; university: string | null }[] };
type Props = { program: Program; user: { id: string; name?: string | null; email?: string | null }; savedDraft?: Record<string, string>; draftVersion?: number; draftStep?: number; draftSavedAt?: string; checkoutPending?: boolean; resumeFilename?: string; paymentAvailable: boolean };
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';
const actionClass = 'rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function ApplyClient({ program, user, savedDraft, draftVersion = 0, draftStep = 1, draftSavedAt, checkoutPending = false, resumeFilename = '', paymentAvailable }: Props) {
  const parts = (user.name || '').trim().split(/\s+/);
  const [form, setForm] = useState<Record<string, string>>({ studentFirstName: parts[0] || '', studentLastName: parts.slice(1).join(' '), studentEmail: user.email || '', studentLevel: 'SCHOOL', studentPhone: '', parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '', school: '', gradYear: '', gender: '', tShirtSize: '', photoConsent: '', resumeUrl: '', initialTopicIdeas: '', areaOfInterest: '', essay: '', shortAnswer: '', firstChoiceProfessor: program.professors[0]?.name || '', secondChoiceProfessor: '', thirdChoiceProfessor: '', previousResearch: '', howLearned: '', ...savedDraft });
  const [step, setStep] = useState(checkoutPending ? 3 : Math.min(3, Math.max(1, draftStep)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState(resumeFilename);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [savedAt, setSavedAt] = useState(draftSavedAt || '');
  const [saveError, setSaveError] = useState('');
  const version = useRef(draftVersion);
  const conflict = useRef(false);
  const initial = useRef(true);
  const mounted = useRef(true);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(checkoutPending);
  const paymentLock = useRef(false);
  const checkoutRef = useRef(checkoutPending);
  const locked = checkoutStarted || busy;
  const summer = ['seoul', 'global'].includes(programKind(program.category));

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => { if (revision.current !== savedRevision.current && !checkoutPending) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [checkoutPending]);

  const persist = useCallback((snapshot: Record<string, string>, currentStep: number, currentRevision: number) => {
    const task = queue.current.then(async () => {
      if (conflict.current || checkoutRef.current) return false;
      if (mounted.current) setSaveState('saving');
      try {
        const result = await saveApplicationDraft(program.id, snapshot, currentStep, version.current);
        if (!result.success) {
          conflict.current = Boolean(result.conflict);
          if (mounted.current) { setSaveState('error'); setSaveError(result.error); }
          return false;
        }
        version.current = result.version;
        savedRevision.current = currentRevision;
        if (mounted.current) { setSavedAt(result.savedAt); setSaveError(''); setSaveState(revision.current === currentRevision ? 'saved' : 'unsaved'); }
        return true;
      } catch {
        if (mounted.current) { setSaveState('error'); setSaveError('Draft not saved. Check your connection, then retry before leaving.'); }
        return false;
      }
    });
    queue.current = task;
    return task;
  }, [program.id, checkoutPending]);

  useEffect(() => {
    if (initial.current) { initial.current = false; return; }
    if (checkoutStarted || busy) return;
    const currentRevision = revision.current;
    const timer = setTimeout(() => { void persist(form, step, currentRevision); }, 900);
    return () => clearTimeout(timer);
  }, [form, step, checkoutStarted, busy, persist]);

  function update(key: string, value: string) {
    revision.current += 1;
    setSaveState('unsaved');
    setForm(previous => ({ ...previous, [key]: value, ...(key === 'studentLevel' && value === 'UNIVERSITY' ? {parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: ''} : {}) }));
    setErrors(previous => { const copy = { ...previous }; delete copy[key]; return copy; });
  }
  function move(next: number) {
    if (next > step) {
      const issues = applicationErrors(form, step);
      if (Object.keys(issues).length) { setErrors(issues); setNotice('Please check the highlighted fields.'); requestAnimationFrame(() => document.getElementById(`apply-${Object.keys(issues)[0]}`)?.focus()); return; }
    }
    revision.current += 1;
    setSaveState('unsaved'); setStep(next); setNotice(''); setErrors({});
    requestAnimationFrame(() => titleRef.current?.focus());
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024 || file.size === 0) { setErrors(previous => ({ ...previous, resumeUrl: 'Choose a PDF up to 5 MB.' })); return; }
    setUploading(true);
    try {
      const data = new FormData(); data.set('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      if (!response.ok) throw new Error(await response.text());
      const document = await response.json(); update('resumeUrl', document.url); setFilename(file.name);
    } catch (error) { setErrors(previous => ({ ...previous, resumeUrl: error instanceof Error ? error.message : 'Upload failed. Retry without leaving this page.' })); }
    finally { setUploading(false); }
  }
  async function checkout() {
    if (paymentLock.current) return;
    const issues = applicationErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); setStep(personalFields.includes(Object.keys(issues)[0]) ? 1 : 2); setNotice('Please complete the highlighted fields before paying.'); return; }
    paymentLock.current = true;
    setBusy(true); setNotice('');
    try {
      if (!checkoutRef.current && !await persist(form, step, revision.current)) throw new Error('Save your draft successfully before starting payment.');
      const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!key || !paymentAvailable) throw new Error('Online payment is currently unavailable. Your draft is saved; contact admissions for assistance.');
      const order = await beginApplicationCheckout(program.id, form);
      if (order.error || !order.orderId) throw new Error(order.error || 'Unable to prepare payment.');
      checkoutRef.current = true; setCheckoutStarted(true);
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const sdk = await loadTossPayments(key);
      await sdk.payment({ customerKey: user.id }).requestPayment({ method: 'CARD', amount: { currency: order.currency!, value: order.amount! }, orderId: order.orderId, orderName: order.orderName!, successUrl: `${window.location.origin}/apply/payment-success?programId=${encodeURIComponent(program.id)}`, failUrl: `${window.location.origin}/apply/payment-fail?programId=${encodeURIComponent(program.id)}`, customerEmail: form.studentEmail, customerName: `${form.studentFirstName} ${form.studentLastName}`.trim() });
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Payment was not completed. Check your payment provider before retrying.'); }
    finally { paymentLock.current = false; setBusy(false); }
  }
  function field(key: string, options: { type?: string; optional?: boolean; multiline?: boolean; words?: number; choices?: [string, string][]; hint?: string } = {}) {
    const id = `apply-${key}`, error = errors[key];
    const common = { id, name: key, value: form[key] || '', disabled: locked, 'aria-invalid': Boolean(error), 'aria-describedby': `${id}-help`, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(key, event.target.value), className: `${inputClass} ${error ? 'border-red-500' : ''}` };
    return <div key={key} className={options.multiline ? 'sm:col-span-2' : ''}><label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">{applicationLabels[key]}{!options.optional && ' *'}</label>
      {options.choices ? <select {...common}><option value="">Select…</option>{options.choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : options.multiline ? <textarea {...common} rows={options.words === 500 ? 7 : 4} maxLength={20000} /> : <input {...common} type={options.type || 'text'} maxLength={key.includes('Email') ? 254 : 200} />}
      <div id={`${id}-help`} className="mt-1 text-xs leading-relaxed">{options.words && <p className={(form[key]?.trim().split(/\s+/).filter(Boolean).length || 0) > options.words ? 'text-red-700' : 'text-slate-500'}>{form[key]?.trim().split(/\s+/).filter(Boolean).length || 0} / {options.words} words</p>}{options.hint && <p className="text-slate-500">{options.hint}</p>}{error && <p className="text-red-700">{error}</p>}</div>
    </div>;
  }

  return <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6"><div className="mx-auto max-w-3xl">
    <Link href={`/research/program/${program.id}`} onClick={event => { if (revision.current !== savedRevision.current && !confirm('Some changes are not saved. Leave this page?')) event.preventDefault(); }} className="text-sm text-slate-600 underline">Back to program</Link>
    <header className="my-6"><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Application</p><h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{program.title}</h1><p className="mt-3 text-sm text-slate-600">Application fee: <strong>{APPLICATION_CHARGE_LABEL}</strong>. Program tuition: <strong>{program.tuition == null ? 'Contact admissions' : `$${program.tuition.toLocaleString()} USD`}</strong>, payable separately after admission.</p><p className="mt-2 text-sm text-slate-600">Your application is submitted only after the application fee is confirmed. Saving a draft does not reserve a place. <Link href="/admissions" className="text-blue-700 underline">Steps and fees</Link> · <Link href="/privacy" className="text-blue-700 underline">Privacy</Link> · <Link href="/refunds" className="text-blue-700 underline">Cancellation &amp; refunds</Link></p></header>
    {!paymentAvailable && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Online payment is currently unavailable. You can prepare and save your application, then <Link href="/contact" className="underline">contact admissions</Link> before paying.</div>}
    {checkoutStarted && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">Your existing checkout has been restored. Review the saved information and resume payment. To correct it or resolve an expired checkout, <Link href="/contact" className="underline">contact admissions</Link> before paying again.</div>}
    <ol aria-label="Application progress" className="mb-5 grid grid-cols-3 gap-2">{['Personal details','Research interests','Review and pay'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`rounded-xl border px-3 py-3 text-xs font-semibold sm:text-sm ${step === index + 1 ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>{index + 1}. {label}</li>)}</ol>
    {!checkoutStarted && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs"><span role="status" className={saveState === 'error' ? 'text-red-700' : 'text-slate-600'}>{saveState === 'saving' ? 'Saving your draft…' : saveState === 'unsaved' ? 'Unsaved changes' : saveState === 'error' ? saveError : savedAt ? `Draft saved to your account · ${new Date(savedAt).toLocaleTimeString()}` : 'Drafts save automatically as you type.'}</span><button type="button" onClick={() => void persist(form, step, revision.current)} disabled={saveState === 'saving' || busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold disabled:opacity-50">Save draft</button></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><h2 ref={titleRef} tabIndex={-1} className="mb-6 text-xl font-bold text-slate-900 outline-none">{['Personal details','Research interests','Review your application'][step - 1]}</h2>
      {notice && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{notice}</div>}
      {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
        {field('studentLevel', { choices: [['SCHOOL','School student'],['UNIVERSITY','University student']] })}{field('school')}
        {field('studentFirstName')}{field('studentLastName')}{field('studentEmail', { type: 'email' })}{field('studentPhone', { type: 'tel' })}
        {field('gradYear', { hint: 'Enter the year you expect to graduate from your current school or university.' })}{field('gender', { optional: true, choices: [['Female','Female'],['Male','Male'],['Other','Other'],['Prefer not to say','Prefer not to say']] })}
        {form.studentLevel !== 'UNIVERSITY' && <><p className="text-sm text-slate-600 sm:col-span-2">Parent or guardian contact for school students.</p>{field('parentFirstName')}{field('parentLastName')}{field('parentEmail', { type: 'email' })}{field('parentPhone', { type: 'tel' })}</>}
        {summer && field('tShirtSize', { optional: true, choices: ['XXS','XS','S','M','L','XL','XXL'].map(value => [value,value]) })}
        {field('photoConsent', { choices: [['No','Do not use my photo or video'],['Yes','Allow use in CRI program publicity']], hint: 'This choice concerns CRI program publicity and does not affect admissions review. School students should discuss this with a parent or guardian.' })}
      </div>}
      {step === 2 && <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="apply-resumeUrl" className="mb-2 block text-sm font-semibold">Academic resume (PDF) *</label><input id="apply-resumeUrl" type="file" accept="application/pdf" disabled={uploading || locked} aria-invalid={Boolean(errors.resumeUrl)} aria-describedby="resume-help" onChange={event => void upload(event.target.files?.[0])} className={inputClass} /><p id="resume-help" className="mt-2 text-xs text-slate-500">PDF up to 5 MB. Include your current GPA if available. Files are private to you and authorized administrators.</p>{uploading && <p role="status" className="mt-2 text-sm">Uploading…</p>}{form.resumeUrl && <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-sm text-blue-700 underline">{filename || 'View uploaded resume'}</a>}{errors.resumeUrl && <p role="alert" className="mt-2 text-sm text-red-700">{errors.resumeUrl}</p>}</div>
        {field('areaOfInterest')}{field('initialTopicIdeas', { multiline: true, hint: 'A finished proposal is not required. Explain what you would like to investigate.' })}{field('essay', { multiline: true, words: 500 })}{field('shortAnswer', { multiline: true, words: 150 })}
        {['firstChoiceProfessor','secondChoiceProfessor','thirdChoiceProfessor'].map((key, index) => field(key, { optional: index > 0, choices: program.professors.map(professor => [professor.name, `${professor.name}${professor.university ? ` (${professor.university})` : ''}`]) }))}
        {program.professors.length === 0 && <p className="text-sm text-amber-800 sm:col-span-2">No faculty selection is currently available. Save your draft and contact admissions before paying.</p>}
        {field('previousResearch', { optional: true, multiline: true, hint: 'You may leave this blank if you have no previous research experience.' })}{field('howLearned', { optional: true })}
      </div>}
      {step === 3 && <div className="space-y-6">{[1,2].map(section => <div key={section} className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">{section === 1 ? 'Personal details' : 'Research interests'}</h3>{!checkoutStarted && <button type="button" disabled={busy} onClick={() => move(section)} className="text-sm font-semibold text-blue-700 underline">Edit {section === 1 ? 'personal details' : 'research interests'}</button>}</div><dl className="space-y-4">{Object.keys(applicationLabels).filter(key => personalFields.includes(key) === (section === 1)).filter(key => !(form.studentLevel === 'UNIVERSITY' && key.startsWith('parent')) && !(key === 'tShirtSize' && !summer)).map(key => <div key={key}><dt className="text-xs font-semibold text-slate-500">{applicationLabels[key]}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900">{key === 'resumeUrl' ? <a href={form[key]} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{filename || 'View uploaded PDF'}</a> : key === 'studentLevel' ? form[key] === 'UNIVERSITY' ? 'University student' : 'School student' : form[key] || 'Not provided'}</dd></div>)}</dl></div>)}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm font-semibold">Application review service</p><p className="mt-2 text-2xl font-bold">{APPLICATION_CHARGE_LABEL}</p><p className="mt-3 text-sm leading-relaxed">This is the application review fee for the program above. Program tuition is separate. The payment window will request this exact KRW amount. Any foreign-currency conversion is handled by your card issuer.</p><p className="mt-3 text-sm">Payment is processed by Toss Payments. Available cards are shown in its payment window. <Link href="/admissions" className="underline">Read the service and fee information</Link> and <Link href="/refunds" className="underline">cancellation and refund policy</Link>. Payment alone does not establish that review services have begun.</p></div>
      </div>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">{step > 1 && !checkoutStarted ? <button type="button" disabled={busy} onClick={() => move(step - 1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">Back</button> : <span />}{step < 3 ? <button type="button" disabled={uploading} onClick={() => move(step + 1)} className={actionClass}>{step === 1 ? 'Continue to research interests' : 'Review application'}</button> : <button type="button" onClick={() => void checkout()} disabled={busy || !paymentAvailable} className={actionClass}>{busy ? 'Opening payment…' : `Pay ${APPLICATION_CHARGE_LABEL} and submit`}</button>}</div>
      <p className="mt-6 text-xs leading-relaxed text-slate-500">Need help? <a href="mailto:support@cri.kr" className="underline">support@cri.kr</a>. If a payment appears on your card but submission is unclear, contact us before paying again.</p>
    </section>
  </div></div>;
}
