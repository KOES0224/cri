'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from "@/i18n/link";
import { useRouter } from 'next/navigation';
import { beginApplicationCheckout, submitApplicationWithoutFee } from '@/app/actions/payment';
import { saveApplicationDraft } from '@/app/actions/applicationDrafts';
import { applicationErrorMessage, applicationErrors, applicationLabels, personalFields } from '@/lib/application-validation';
import { APPLICATION_CHARGE_LABEL, APPLICATION_FEE_ENABLED } from '@/lib/application-fee';
import { programKind } from '@/lib/program-policy';
import { trackEvent } from '@/lib/analytics';
import { useT } from '@/i18n/client';

type Program = { id: string; title: string; category: string; tuition: number | null; professors: { id: string; name: string; university: string | null }[] };
type Props = { program: Program; user: { id: string; name?: string | null; email?: string | null }; applicantRole?: string | null; savedDraft?: Record<string, string>; draftVersion?: number; draftStep?: number; draftSavedAt?: string; checkoutPending?: boolean; resumeFilename?: string; paymentAvailable: boolean };
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';
const actionClass = 'rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function ApplyClient({ program, user, applicantRole = 'STUDENT', savedDraft, draftVersion = 0, draftStep = 1, draftSavedAt, checkoutPending = false, resumeFilename = '', paymentAvailable }: Props) {
  const { t } = useT();
  const router = useRouter();
  const feeEnabled = APPLICATION_FEE_ENABLED;
  const copy = t.apply;
  const label = (key: string) => copy.fields[key] ?? applicationLabels[key];
  // Validation and action results carry stable codes ("required", "words:500", "invalidFields:essay"); unknown values are shown as-is.
  const errorText = (code: string) => {
    const [name, argument] = code.split(':');
    const entry = (copy.errors as Record<string, string | ((value: never) => string)>)[name];
    if (typeof entry === 'function') return name === 'invalidFields' ? (entry as (field: string) => string)(label(argument) ?? argument) : (entry as (limit: number) => string)(Number(argument));
    return entry ?? applicationErrorMessage(code);
  };
  const actionText = (result: { error?: string; code?: string }, fallback: string) => (result.code ? errorText(result.code) : result.error) || fallback;
  const parts = (user.name || '').trim().split(/\s+/);
  // A parent or guardian account applies on behalf of a student: prefill the guardian contact, not the student fields.
  const parentApplying = applicantRole === 'PARENT';
  const prefill = parentApplying
    ? { studentFirstName: '', studentLastName: '', studentEmail: '', parentFirstName: parts[0] || '', parentLastName: parts.slice(1).join(' '), parentEmail: user.email || '' }
    : { studentFirstName: parts[0] || '', studentLastName: parts.slice(1).join(' '), studentEmail: user.email || '', parentFirstName: '', parentLastName: '', parentEmail: '' };
  const [form, setForm] = useState<Record<string, string>>({ ...prefill, studentLevel: 'SCHOOL', studentPhone: '', parentPhone: '', school: '', gradYear: '', gender: '', tShirtSize: '', photoConsent: '', resumeUrl: '', initialTopicIdeas: '', areaOfInterest: '', essay: '', shortAnswer: '', firstChoiceProfessor: program.professors[0]?.name || '', secondChoiceProfessor: '', thirdChoiceProfessor: '', previousResearch: '', howLearned: '', ...savedDraft });
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
          if (mounted.current) { setSaveState('error'); setSaveError(actionText(result, copy.notices.draftNotSaved)); }
          return false;
        }
        version.current = result.version;
        savedRevision.current = currentRevision;
        if (mounted.current) { setSavedAt(result.savedAt); setSaveError(''); setSaveState(revision.current === currentRevision ? 'saved' : 'unsaved'); }
        return true;
      } catch {
        if (mounted.current) { setSaveState('error'); setSaveError(copy.notices.draftNotSaved); }
        return false;
      }
    });
    queue.current = task;
    return task;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copy/actionText follow the locale, which is fixed for the page's lifetime.
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
      if (Object.keys(issues).length) { setErrors(issues); setNotice(copy.notices.checkFields); requestAnimationFrame(() => document.getElementById(`apply-${Object.keys(issues)[0]}`)?.focus()); return; }
    }
    revision.current += 1;
    if (next > step) trackEvent('application_step', { program_id: program.id, step: next });
    setSaveState('unsaved'); setStep(next); setNotice(''); setErrors({});
    requestAnimationFrame(() => titleRef.current?.focus());
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024 || file.size === 0) { setErrors(previous => ({ ...previous, resumeUrl: copy.notices.pdfOnly })); return; }
    setUploading(true);
    try {
      const data = new FormData(); data.set('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      // The route names the reason in X-Error-Code (a t.apply.errors key); the English body is the fallback.
      if (!response.ok) throw new Error(response.headers.get('X-Error-Code') || await response.text() || copy.notices.uploadFailed);
      const document = await response.json(); update('resumeUrl', document.url); setFilename(file.name);
    } catch (error) { setErrors(previous => ({ ...previous, resumeUrl: error instanceof Error && error.message ? errorText(error.message) : copy.notices.uploadFailed })); }
    finally { setUploading(false); }
  }
  async function submitFree() {
    if (paymentLock.current) return;
    const issues = applicationErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); setStep(personalFields.includes(Object.keys(issues)[0]) ? 1 : 2); setNotice(copy.notices.completeBeforeSubmit); return; }
    paymentLock.current = true;
    setBusy(true); setNotice('');
    try {
      if (!await persist(form, step, revision.current)) throw new Error(copy.notices.saveBeforeSubmit);
      const result = await submitApplicationWithoutFee(program.id, form);
      if (result.error || !result.applicationId) throw new Error(actionText(result, copy.notices.submitFailed));
      savedRevision.current = revision.current;
      trackEvent('application_submitted', { program_id: program.id, program_title: program.title, value: 0, currency: 'USD' });
      router.push(`/apply/submitted?programId=${encodeURIComponent(program.id)}`);
    } catch (error) { setNotice(error instanceof Error && error.message ? error.message : copy.notices.notSubmitted); paymentLock.current = false; setBusy(false); }
  }
  async function checkout() {
    if (paymentLock.current) return;
    const issues = applicationErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); setStep(personalFields.includes(Object.keys(issues)[0]) ? 1 : 2); setNotice(copy.notices.completeBeforePay); return; }
    paymentLock.current = true;
    setBusy(true); setNotice('');
    try {
      if (!checkoutRef.current && !await persist(form, step, revision.current)) throw new Error(copy.notices.saveBeforePay);
      const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!key || !paymentAvailable) throw new Error(copy.notices.paymentUnavailable);
      const order = await beginApplicationCheckout(program.id, form);
      if (order.error || !order.orderId) throw new Error(actionText(order, copy.notices.preparePaymentFailed));
      checkoutRef.current = true; setCheckoutStarted(true);
      trackEvent('checkout_begin', { program_id: program.id, program_title: program.title, value: order.amount, currency: order.currency });
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      const sdk = await loadTossPayments(key);
      await sdk.payment({ customerKey: user.id }).requestPayment({ method: 'CARD', amount: { currency: order.currency!, value: order.amount! }, orderId: order.orderId, orderName: order.orderName!, successUrl: `${window.location.origin}/apply/payment-success?programId=${encodeURIComponent(program.id)}`, failUrl: `${window.location.origin}/apply/payment-fail?programId=${encodeURIComponent(program.id)}`, customerEmail: user.email || form.studentEmail, customerName: `${form.studentFirstName} ${form.studentLastName}`.trim() });
    } catch (error) { setNotice(error instanceof Error && error.message ? error.message : copy.notices.paymentNotCompleted); }
    finally { paymentLock.current = false; setBusy(false); }
  }
  function field(key: string, options: { type?: string; optional?: boolean; multiline?: boolean; words?: number; choices?: [string, string][]; hint?: string } = {}) {
    const id = `apply-${key}`, error = errors[key];
    const common = { id, name: key, value: form[key] || '', disabled: locked, 'aria-invalid': Boolean(error), 'aria-describedby': `${id}-help`, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(key, event.target.value), className: `${inputClass} ${error ? 'border-red-500' : ''}` };
    return <div key={key} className={options.multiline ? 'sm:col-span-2' : ''}><label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">{label(key)}{!options.optional && ' *'}</label>
      {options.choices ? <select {...common}><option value="">{copy.select}</option>{options.choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : options.multiline ? <textarea {...common} rows={options.words === 500 ? 7 : 4} maxLength={20000} /> : <input {...common} type={options.type || 'text'} maxLength={key.includes('Email') ? 254 : 200} />}
      <div id={`${id}-help`} className="mt-1 text-xs leading-relaxed">{options.words && <p className={(form[key]?.trim().split(/\s+/).filter(Boolean).length || 0) > options.words ? 'text-red-700' : 'text-slate-500'}>{copy.words(form[key]?.trim().split(/\s+/).filter(Boolean).length || 0, options.words)}</p>}{options.hint && <p className="text-slate-500">{options.hint}</p>}{error && <p className="text-red-700">{errorText(error)}</p>}</div>
    </div>;
  }

  return <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6"><div className="mx-auto max-w-3xl">
    <Link href={`/research/program/${program.id}`} onClick={event => { if (revision.current !== savedRevision.current && !confirm(copy.leaveConfirm)) event.preventDefault(); }} className="text-sm text-slate-600 underline">{copy.back}</Link>
    <header className="my-6"><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{copy.eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{program.title}</h1><p className="mt-3 text-sm text-slate-600">{feeEnabled ? <>{copy.feeLine.a}<strong>{APPLICATION_CHARGE_LABEL}</strong>{copy.feeLine.b}</> : copy.free.feeLine.a}<strong>{program.tuition == null ? copy.contactAdmissions : `$${program.tuition.toLocaleString()} USD`}</strong>{feeEnabled ? copy.feeLine.c : copy.free.feeLine.c}</p><p className="mt-2 text-sm text-slate-600">{feeEnabled ? copy.submittedNote : copy.free.submittedNote}<Link href="/admissions" className="text-blue-700 underline">{copy.stepsAndFees}</Link> · <Link href="/privacy" className="text-blue-700 underline">{copy.privacy}</Link> · <Link href="/refunds" className="text-blue-700 underline">{copy.refunds}</Link></p></header>
    {feeEnabled && !paymentAvailable && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{copy.paymentUnavailable.a}<Link href="/contact" className="underline">{copy.paymentUnavailable.link}</Link>{copy.paymentUnavailable.b}</div>}
    {checkoutStarted && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">{copy.checkoutRestored.a}<Link href="/contact" className="underline">{copy.checkoutRestored.link}</Link>{copy.checkoutRestored.b}</div>}
    <ol aria-label={copy.progress} className="mb-5 grid grid-cols-3 gap-2">{[copy.progressSteps[0], copy.progressSteps[1], feeEnabled ? copy.progressSteps[2] : copy.free.step3].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`rounded-xl border px-3 py-3 text-xs font-semibold sm:text-sm ${step === index + 1 ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>{index + 1}. {label}</li>)}</ol>
    {!checkoutStarted && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs"><span role="status" className={saveState === 'error' ? 'text-red-700' : 'text-slate-600'}>{saveState === 'saving' ? copy.saving : saveState === 'unsaved' ? copy.unsaved : saveState === 'error' ? saveError : savedAt ? copy.savedAt(new Date(savedAt).toLocaleTimeString()) : copy.autosave}</span><button type="button" onClick={() => void persist(form, step, revision.current)} disabled={saveState === 'saving' || busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold disabled:opacity-50">{copy.saveDraft}</button></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><h2 ref={titleRef} tabIndex={-1} className="mb-6 text-xl font-bold text-slate-900 outline-none">{copy.headings[step - 1]}</h2>
      {notice && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{notice}</div>}
      {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
        {parentApplying && <p className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-950 sm:col-span-2">{copy.parentApplying.a}<strong>{copy.parentApplying.strong}</strong>{copy.parentApplying.b}</p>}
        {field('studentLevel', { choices: [['SCHOOL',copy.schoolStudent],['UNIVERSITY',copy.universityStudent]] })}{field('school')}
        {field('studentFirstName')}{field('studentLastName')}{field('studentEmail', { type: 'email' })}{field('studentPhone', { type: 'tel' })}
        {field('gradYear', { hint: copy.gradYearHint })}{field('gender', { optional: true, choices: ['Female','Male','Other','Prefer not to say'].map(value => [value, copy.genders[value] ?? value]) })}
        {form.studentLevel !== 'UNIVERSITY' && <><p className="text-sm text-slate-600 sm:col-span-2">{copy.parentContactNote}</p>{field('parentFirstName')}{field('parentLastName')}{field('parentEmail', { type: 'email' })}{field('parentPhone', { type: 'tel' })}</>}
        {summer && field('tShirtSize', { optional: true, choices: ['XXS','XS','S','M','L','XL','XXL'].map(value => [value,value]) })}
        {field('photoConsent', { choices: [['No',copy.photoNo],['Yes',copy.photoYes]], hint: copy.photoHint })}
      </div>}
      {step === 2 && <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="apply-resumeUrl" className="mb-2 block text-sm font-semibold">{copy.resumeLabel}</label><input id="apply-resumeUrl" type="file" accept="application/pdf" disabled={uploading || locked} aria-invalid={Boolean(errors.resumeUrl)} aria-describedby="resume-help" onChange={event => void upload(event.target.files?.[0])} className={inputClass} /><p id="resume-help" className="mt-2 text-xs text-slate-500">{copy.resumeHelp}</p>{uploading && <p role="status" className="mt-2 text-sm">{copy.uploading}</p>}{form.resumeUrl && <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-sm text-blue-700 underline">{filename || copy.viewResume}</a>}{errors.resumeUrl && <p role="alert" className="mt-2 text-sm text-red-700">{errorText(errors.resumeUrl)}</p>}</div>
        {field('areaOfInterest')}{field('initialTopicIdeas', { multiline: true, hint: copy.topicHint })}{field('essay', { multiline: true, words: 500 })}{field('shortAnswer', { multiline: true, words: 150 })}
        {['firstChoiceProfessor','secondChoiceProfessor','thirdChoiceProfessor'].map((key, index) => field(key, { optional: index > 0, choices: program.professors.map(professor => [professor.name, `${professor.name}${professor.university ? ` (${professor.university})` : ''}`]) }))}
        {program.professors.length === 0 && <p className="text-sm text-amber-800 sm:col-span-2">{feeEnabled ? copy.noFaculty : copy.free.noFaculty}</p>}
        {field('previousResearch', { optional: true, multiline: true, hint: copy.previousHint })}{field('howLearned', { optional: true })}
      </div>}
      {step === 3 && <div className="space-y-6">{[1,2].map(section => <div key={section} className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">{section === 1 ? copy.headings[0] : copy.headings[1]}</h3>{!checkoutStarted && <button type="button" disabled={busy} onClick={() => move(section)} className="text-sm font-semibold text-blue-700 underline">{section === 1 ? copy.editPersonal : copy.editResearch}</button>}</div><dl className="space-y-4">{Object.keys(applicationLabels).filter(key => personalFields.includes(key) === (section === 1)).filter(key => !(form.studentLevel === 'UNIVERSITY' && key.startsWith('parent')) && !(key === 'tShirtSize' && !summer)).map(key => <div key={key}><dt className="text-xs font-semibold text-slate-500">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900">{key === 'resumeUrl' ? <a href={form[key]} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{filename || copy.viewPdf}</a> : key === 'studentLevel' ? form[key] === 'UNIVERSITY' ? copy.universityStudent : copy.schoolStudent : form[key] || copy.notProvided}</dd></div>)}</dl></div>)}
        {!feeEnabled && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">{copy.free.box.title}</p><p className="mt-2 text-sm leading-relaxed text-emerald-900/80">{copy.free.box.body}</p></div>}
        {feeEnabled && <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm font-semibold">{copy.feeBox.title}</p><p className="mt-2 text-2xl font-bold">{APPLICATION_CHARGE_LABEL}</p><p className="mt-3 text-sm leading-relaxed">{copy.feeBox.body1}</p><p className="mt-3 text-sm">{copy.feeBox.body2a}<Link href="/admissions" className="underline">{copy.feeBox.link1}</Link>{copy.feeBox.and}<Link href="/refunds" className="underline">{copy.feeBox.link2}</Link>{copy.feeBox.body2b}</p></div>}
      </div>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">{step > 1 && !checkoutStarted ? <button type="button" disabled={busy} onClick={() => move(step - 1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">{copy.backButton}</button> : <span />}{step < 3 ? <button type="button" disabled={uploading} onClick={() => move(step + 1)} className={actionClass}>{step === 1 ? copy.continueResearch : copy.reviewApplication}</button> : (feeEnabled ? <button type="button" onClick={() => void checkout()} disabled={busy || !paymentAvailable} className={actionClass}>{busy ? copy.openingPayment : copy.payAndSubmit(APPLICATION_CHARGE_LABEL)}</button> : <button type="button" onClick={() => void submitFree()} disabled={busy} className={actionClass}>{busy ? copy.free.submitting : copy.free.submit}</button>)}</div>
      <p className="mt-6 text-xs leading-relaxed text-slate-500">{copy.help.a}<a href="mailto:support@cri.kr" className="underline">support@cri.kr</a>{copy.help.b}</p>
    </section>
  </div></div>;
}
