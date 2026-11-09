'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from "@/i18n/link";
import { Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { beginApplicationCheckout, reportPaymentProblem, resolvePendingCheckout, submitApplicationWithoutFee } from '@/app/actions/payment';
import { checkFeeCode } from '@/app/actions/feeCodes';
import { saveApplicationDraft } from '@/app/actions/applicationDrafts';
import { applicationErrorMessage, applicationErrors, applicationLabels, personalFields } from '@/lib/application-validation';
import { APPLICATION_CHARGE, APPLICATION_CHARGE_LABEL, APPLICATION_CHARGE_PRICE, TOSS_AGREEMENT_VARIANT_KEY } from '@/lib/application-fee';
import { COMPANY } from '@/lib/company';
import { programKind } from '@/lib/program-policy';
import { trackEvent } from '@/lib/analytics';
import { useT } from '@/i18n/client';
import { COUNTRY_CODES, countryName } from '@/lib/countries';
import { metaTrack, metaTrackCustom, newEventId } from '@/lib/meta/pixel';
import type { MetaCustomData } from '@/lib/meta/config';

type Program = { id: string; title: string; category: string; tuition: number | null; professors: { id: string; name: string; university: string | null }[] };
type Props = { program: Program; content: MetaCustomData; user: { id: string; name?: string | null; email?: string | null }; applicantRole?: string | null; savedDraft?: Record<string, string>; draftVersion?: number; draftStep?: number; draftSavedAt?: string; checkoutPending?: boolean; resumeFilename?: string; paymentAvailable: boolean; paymentVariantKey?: string; feeEnabled: boolean; reviewMode?: boolean; feeIntroducedSinceDraft?: boolean; orderFeeCode?: string };
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';
const actionClass = 'rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function ApplyClient({ program, content, user, applicantRole = 'STUDENT', savedDraft, draftVersion = 0, draftStep = 1, draftSavedAt, checkoutPending = false, feeIntroducedSinceDraft = false, resumeFilename = '', paymentAvailable, paymentVariantKey = 'DEFAULT', feeEnabled, reviewMode = false, orderFeeCode }: Props) {
  const { t, locale } = useT();
  const router = useRouter();
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
  const [form, setForm] = useState<Record<string, string>>({ ...prefill, studentLevel: 'SCHOOL', residenceCountry: '', studentPhone: '', parentPhone: '', school: '', gradYear: '', gender: '', tShirtSize: '', photoConsent: '', resumeUrl: '', initialTopicIdeas: '', areaOfInterest: '', essay: '', shortAnswer: '', firstChoiceProfessor: program.professors[0]?.name || '', secondChoiceProfessor: '', thirdChoiceProfessor: '', previousResearch: '', howLearned: '', ...savedDraft });
  const [step, setStep] = useState(checkoutPending ? 3 : Math.min(3, Math.max(1, draftStep)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState(resumeFilename);
  // Toss payment widget (USD): rendered on the review step, then requestPayment opens the provider's window.
  type TossWidgets = Awaited<ReturnType<Awaited<ReturnType<typeof import('@tosspayments/tosspayments-sdk')['loadTossPayments']>>['widgets']>>;
  type PaymentMethodsUi = Awaited<ReturnType<TossWidgets['renderPaymentMethods']>>;
  const widgetRef = useRef<{ widgets: TossWidgets; methods: PaymentMethodsUi } | null>(null);
  const [widgetState, setWidgetState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  // The button says what the click does: pay by card here, or continue to PayPal's own page.
  const [payMethod, setPayMethod] = useState<'card' | 'paypal'>('card');
  // Referral code: given by a school, counselor or agency, it reduces the fee or waives it. What the form shows is only
  // a preview; the server looks the code up again when the order is made or the application is submitted.
  const [feeCode, setFeeCode] = useState<{ code: string; feeAmount: number } | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState('');
  const due = feeCode ? feeCode.feeAmount : APPLICATION_CHARGE.amount;
  const waived = feeEnabled && due === 0;
  const dollars = (amount: number) => `$${amount.toFixed(2)}`;
  // Kept for this tab and account, so coming back after a declined card does not quietly fall back to the full fee
  // and the next person to sign in on a shared computer does not inherit the code.
  const codeStoreKey = `cri_fee_code_${user.id}_${program.id}`;
  const rememberCode = (value: { code: string; feeAmount: number } | null) => {
    try { if (value) sessionStorage.setItem(codeStoreKey, JSON.stringify(value)); else sessionStorage.removeItem(codeStoreKey); } catch {}
  };
  // True while a remembered code is being re-checked: Pay waits, so the order is never priced without it.
  const [codeRestoring, setCodeRestoring] = useState(false);
  const dueRef = useRef(due);
  useEffect(() => { dueRef.current = due; }, [due]);
  useEffect(() => {
    if (!feeEnabled) return;
    let stored: { code: string; feeAmount: number } | null = null;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(codeStoreKey) || 'null');
      if (parsed && typeof parsed.code === 'string' && Number.isInteger(parsed.feeAmount) && parsed.feeAmount >= 0 && parsed.feeAmount < APPLICATION_CHARGE.amount) stored = { code: parsed.code, feeAmount: parsed.feeAmount };
    } catch {}
    // Not remembered in this tab (another device, a new session): the code of the applicant's own unpaid order, if any.
    const remembered = stored ?? (orderFeeCode ? { code: orderFeeCode, feeAmount: APPLICATION_CHARGE.amount } : null);
    if (!remembered) return;
    const applied = stored;
    let active = true;
    const timer = window.setTimeout(() => { if (active) setCodeRestoring(true); }, 0);
    const finish = (value: { code: string; feeAmount: number } | null) => { if (!active) return; setFeeCode(value); setCodeRestoring(false); };
    checkFeeCode(remembered.code, true).then(result => {
      if (!active) return;
      if (result.ok) { const fresh = { code: result.code, feeAmount: result.feeAmount }; try { sessionStorage.setItem(codeStoreKey, JSON.stringify(fresh)); } catch {} finish(fresh); return; }
      // Only a definite "this code no longer works" forgets it, and says so next to the reopened field. A busy or
      // failed check keeps what this tab had applied: the server prices the order again at Pay, and the payment form
      // charges exactly that.
      if (['feeCodeInvalid', 'feeCodeExpired', 'feeCodeUsedUp'].includes(result.code)) {
        try { sessionStorage.removeItem(codeStoreKey); } catch {}
        finish(null);
        setCodeOpen(true); setCodeError(copy.pay.codeNoLonger(remembered.code, dollars(APPLICATION_CHARGE.amount)));
      }
      else finish(applied);
    }).catch(() => finish(applied));
    return () => { active = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copy follows the locale, which is fixed for the page's lifetime.
  }, [feeEnabled, codeStoreKey, orderFeeCode]);
  // Per-instance ids: Next can keep a hidden copy of the page, and the widget mounts by CSS selector.
  const widgetId = useId();
  // Attribute selectors need no escaping, so nothing browser-only runs during server rendering.
  const methodsId = `${widgetId}methods`, agreementId = `${widgetId}agreement`;
  const methodsSelector = `[id="${methodsId}"]`, agreementSelector = `[id="${agreementId}"]`;
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
  // `checkoutPending` means an earlier payment reached the provider and was never settled here. The server settles it
  // when the form opens: a payment that went through becomes the application, one that ended without a charge frees
  // the form again, and only an unclear one keeps the form locked for admissions.
  const [earlierPayment, setEarlierPayment] = useState<'none' | 'checking' | 'wait' | 'review'>(checkoutPending ? 'checking' : 'none');
  const [recheck, setRecheck] = useState(0);
  useEffect(() => {
    if (!checkoutPending) return;
    let active = true, timer: number | undefined;
    // A payment still in progress at the provider settles within seconds or expires by itself: look a few more times
    // before leaving it to the "Check again" button.
    const delays = [3000, 6000, 12000, 24000];
    const run = (attempt: number) => resolvePendingCheckout(program.id).then(result => {
      if (!active) return;
      if (result.state === 'paid') router.replace('/dashboard/applications');
      else if (result.state === 'review') setEarlierPayment('review');
      else if (result.state === 'wait') { setEarlierPayment('wait'); if (attempt < delays.length) timer = window.setTimeout(() => run(attempt + 1), delays[attempt]); }
      else window.location.reload();
    }).catch(() => { if (active) setEarlierPayment('wait'); });
    void run(0);
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [checkoutPending, program.id, router, recheck]);
  const paymentLock = useRef(false);
  const checkoutRef = useRef(checkoutPending);
  const locked = checkoutStarted || busy;
  const summer = ['seoul', 'global'].includes(programKind(program.category));

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Meta custom event: the form was opened (step 1); later steps are reported from move().
  const started = useRef(false);
  // The payment-review account is not a prospect: none of its steps are reported to ad or analytics tools.
  useEffect(() => { if (started.current || checkoutPending || reviewMode) return; started.current = true; metaTrackCustom('StartApplication', { ...content, step }, newEventId()); }, [checkoutPending, content, step, reviewMode]);
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => { if (revision.current !== savedRevision.current && !checkoutPending) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [checkoutPending]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    // A code that waives the fee leaves nothing to pay: no payment form is shown.
    if (step !== 3 || !feeEnabled || waived || !paymentAvailable || !key) return;
    let cancelled = false;
    let methods: PaymentMethodsUi | undefined, agreement: Awaited<ReturnType<TossWidgets['renderAgreement']>> | undefined;
    setWidgetState('loading');
    (async () => {
      try {
        const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
        const widgets = (await loadTossPayments(key)).widgets({ customerKey: user.id });
        await widgets.setAmount({ currency: APPLICATION_CHARGE.currency, value: dueRef.current });
        if (cancelled) return;
        [methods, agreement] = await Promise.all([
          widgets.renderPaymentMethods({ selector: methodsSelector, variantKey: paymentVariantKey }),
          widgets.renderAgreement({ selector: agreementSelector, variantKey: TOSS_AGREEMENT_VARIANT_KEY }),
        ]);
        if (cancelled) { methods.destroy(); agreement.destroy(); return; }
        widgetRef.current = { widgets, methods };
        methods.on('paymentMethodSelect', selected => setPayMethod(selected?.code === 'PAYPAL' ? 'paypal' : 'card'));
        void methods.getSelectedPaymentMethod().then(selected => { if (!cancelled) setPayMethod(selected?.code === 'PAYPAL' ? 'paypal' : 'card'); }).catch(() => {});
        setWidgetState('ready');
      } catch (error) {
        console.error('Toss payment widget failed to load', error instanceof Error ? error.message : error);
        if (!cancelled) setWidgetState('error');
        // An applicant who cannot see the payment form cannot apply: tell admissions straight away (never the review account's tests).
        if (!cancelled && !reviewMode) void reportPaymentProblem(program.id, 'form', (error as { code?: string } | null)?.code, error instanceof Error ? error.message : undefined).catch(() => {});
      }
    })();
    return () => { cancelled = true; widgetRef.current = null; try { methods?.destroy(); agreement?.destroy(); } catch {} };
  }, [step, feeEnabled, waived, paymentAvailable, user.id, methodsSelector, agreementSelector, paymentVariantKey, program.id, reviewMode]);
  // A reduced fee changes the amount the already-rendered payment form will charge.
  useEffect(() => {
    const current = widgetRef.current;
    if (!current || widgetState !== 'ready' || waived) return;
    void current.widgets.setAmount({ currency: APPLICATION_CHARGE.currency, value: due }).catch(() => {});
  }, [due, widgetState, waived]);

  async function applyCode() {
    // Never while a payment or submission is starting: the order must be priced with the code the form showed.
    if (codeBusy || busy || !codeInput.trim()) return;
    setCodeBusy(true); setCodeError('');
    try {
      const result = await checkFeeCode(codeInput);
      if (!result.ok) { setCodeError(result.code === 'feeCodeRetry' ? copy.pay.codeFailed : errorText(result.code)); return; }
      const applied = { code: result.code, feeAmount: result.feeAmount };
      setFeeCode(applied); setCodeInput(''); setCodeOpen(false); setNotice('');
      rememberCode(applied);
      // The field just left the page: keep keyboard and screen-reader users at the applied code.
      requestAnimationFrame(() => document.getElementById(`${widgetId}coderemove`)?.focus());
    } catch { setCodeError(copy.pay.codeFailed); }
    finally { setCodeBusy(false); }
  }
  function removeCode() {
    setFeeCode(null); setCodeError('');
    rememberCode(null);
    requestAnimationFrame(() => document.getElementById(`${widgetId}codelink`)?.focus());
  }
  // The server no longer accepts the applied code (switched off, expired or used up since it was applied): the form
  // stops showing it as applied and says so, instead of keeping a reduced or zero total that cannot be used.
  function dropCode(code: string) {
    const message = copy.pay.codeNoLonger(code, dollars(APPLICATION_CHARGE.amount));
    // The field reopens empty: the next Pay goes ahead at the full fee the message names, unless a code is typed again.
    setFeeCode(null); rememberCode(null); setCodeOpen(true); setCodeInput(''); setCodeError(message);
    return message;
  }
  const codeRefused = (code?: string) => code === 'feeCodeInvalid' || code === 'feeCodeExpired' || code === 'feeCodeUsedUp';

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
    if (next > step && !reviewMode) { trackEvent('application_step', { program_id: program.id, step: next }); metaTrackCustom('StartApplication', { ...content, step: next }, newEventId()); }
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
  // Without a payment: the fee is off, or a referral code waives it (the code is checked and counted on the server).
  async function submitFree(code?: string) {
    if (paymentLock.current) return;
    const issues = applicationErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); setStep(personalFields.includes(Object.keys(issues)[0]) ? 1 : 2); setNotice(copy.notices.completeBeforeSubmit); return; }
    paymentLock.current = true;
    setBusy(true); setNotice('');
    try {
      if (!await persist(form, step, revision.current)) throw new Error(copy.notices.saveBeforeSubmit);
      const result = await submitApplicationWithoutFee(program.id, form, code);
      // Only a page from before the fee was switched on can be told this: the draft is saved, so load the current form.
      if ('code' in result && result.code === 'feeRequired' && !feeEnabled) { window.location.reload(); return; }
      if (code && 'code' in result && codeRefused(result.code)) throw new Error(dropCode(code));
      if (result.error || !result.applicationId) throw new Error(actionText(result, copy.notices.submitFailed));
      savedRevision.current = revision.current;
      rememberCode(null);
      // One conversion per application: a repeat submission (already applied, or a second tab) reports nothing. The
      // application id is the transaction id for GTM and the event id for Meta, so every platform can deduplicate.
      if (!reviewMode && !result.duplicate) trackEvent('application_submitted', { program_id: program.id, program_title: program.title, value: 0, currency: 'USD', transaction_id: result.applicationId });
      if (!reviewMode && !result.duplicate && result.eventId) metaTrack('SubmitApplication', result.tracking || content, result.eventId);
      router.push(`/apply/submitted?programId=${encodeURIComponent(program.id)}`);
    } catch (error) { setNotice(error instanceof Error && error.message ? error.message : copy.notices.notSubmitted); paymentLock.current = false; setBusy(false); }
  }
  async function checkout() {
    if (paymentLock.current) return;
    const issues = applicationErrors(form);
    if (Object.keys(issues).length) { setErrors(issues); setStep(personalFields.includes(Object.keys(issues)[0]) ? 1 : 2); setNotice(copy.notices.completeBeforePay); return; }
    // A code that was typed but never applied would be ignored and the full fee charged: stop and ask.
    if (!feeCode && codeOpen && codeInput.trim()) { setCodeError(copy.pay.codeNotApplied); setNotice(copy.pay.codeNotApplied); document.getElementById(`${widgetId}code`)?.focus(); return; }
    paymentLock.current = true;
    setBusy(true); setNotice('');
    try {
      if (!checkoutRef.current && !await persist(form, step, revision.current)) throw new Error(copy.notices.saveBeforePay);
      const widget = widgetRef.current;
      if (!paymentAvailable || !widget) throw new Error(copy.notices.paymentUnavailable);
      const order = await beginApplicationCheckout(program.id, form, feeCode?.code);
      // An earlier payment for this application had gone through unrecorded; it is recorded now, with no second charge.
      if ('alreadyPaid' in order && order.alreadyPaid) { savedRevision.current = revision.current; router.replace('/dashboard/applications'); return; }
      // Only a page from before the fee was switched off can be told this: the draft is saved, so load the current form.
      if ('code' in order && order.code === 'feeDisabled') { window.location.reload(); return; }
      if (feeCode && 'code' in order && codeRefused(order.code)) throw new Error(dropCode(feeCode.code));
      // The code turned out to cover the whole fee: let the applicant apply it again and submit without payment.
      if (feeCode && 'code' in order && order.code === 'feeCodeWaives') { const code = feeCode.code; setFeeCode(null); rememberCode(null); setCodeOpen(true); setCodeInput(code); }
      if (order.error || !order.orderId) throw new Error(actionText(order, copy.notices.preparePaymentFailed));
      checkoutRef.current = true; setCheckoutStarted(true);
      if (!reviewMode) trackEvent('checkout_begin', { program_id: program.id, program_title: program.title, value: order.amount, currency: order.currency });
      if (!reviewMode && order.tracking) metaTrack('InitiateCheckout', order.tracking, order.eventId);
      // The payment form charges exactly what the server priced, whatever the form last showed.
      await widget.widgets.setAmount({ currency: order.currency!, value: order.amount! });
      // PayPal (if offered) needs the order contents; cards do not.
      const selected = await widget.methods.getSelectedPaymentMethod().catch(() => null);
      const paypal = selected?.code === 'PAYPAL';
      await widget.widgets.requestPayment({
        orderId: order.orderId, orderName: order.orderName!,
        successUrl: `${window.location.origin}/apply/payment-success?programId=${encodeURIComponent(program.id)}`,
        failUrl: `${window.location.origin}/apply/payment-fail?programId=${encodeURIComponent(program.id)}`,
        customerEmail: user.email || form.studentEmail, customerName: `${form.studentFirstName} ${form.studentLastName}`.trim(),
        ...(paypal ? { foreignEasyPay: { country: form.residenceCountry || 'US', products: [{ name: order.orderName!.slice(0, 100), quantity: 1, unitAmount: order.amount!, currency: order.currency!, description: 'CRI application review fee' }] } } : {}),
      });
    } catch (error) {
      // Nothing has been charged at this point (the charge happens only after the provider returns to our site), so the
      // form is unlocked again and the applicant can edit or retry.
      checkoutRef.current = false; setCheckoutStarted(false);
      const code = (error as { code?: string } | null)?.code;
      const known = code === 'USER_CANCEL' || code === 'PAY_PROCESS_CANCELED' ? copy.notices.paymentWindowClosed
        : code === 'NEED_AGREEMENT_WITH_REQUIRED_TERMS' ? copy.notices.acceptPaymentTerms
        : code === 'NOT_SELECTED_PAYMENT_METHOD' ? copy.notices.choosePaymentMethod : '';
      // The provider's own sentence may be in Korean and is meant for the merchant: applicants get our wording and the
      // code as a reference; the review account, whose job is to test this path, sees the original.
      const reference = typeof code === 'string' ? code.replace(/[^A-Za-z0-9_]/g, '').slice(0, 40) : '';
      setNotice(known || (reference && !reviewMode ? `${copy.notices.paymentNotCompleted} (${reference})` : error instanceof Error && error.message ? error.message : copy.notices.paymentNotCompleted));
      // Anything other than the payer's own choice means the payment window itself did not work for this applicant.
      if (!known && code && !reviewMode) void reportPaymentProblem(program.id, 'window', code, error instanceof Error ? error.message : undefined).catch(() => {});
    }
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
    <header className="my-6"><p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{copy.eyebrow}</p><h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{program.title}</h1><p className="mt-3 text-sm text-slate-600">{feeEnabled ? <>{copy.feeLine.a}<strong>{APPLICATION_CHARGE_LABEL}</strong>{copy.feeLine.b}</> : copy.free.feeLine.a}<strong>{program.tuition == null ? copy.contactAdmissions : `$${program.tuition.toLocaleString()} USD`}</strong>{feeEnabled ? copy.feeLine.c : copy.free.feeLine.c}</p><p className="mt-2 text-sm text-slate-600">{feeEnabled && !waived ? copy.submittedNote : copy.free.submittedNote}<Link href="/admissions" className="text-blue-700 underline">{copy.stepsAndFees}</Link> · <Link href="/terms" className="text-blue-700 underline">{t.footer.terms}</Link> · <Link href="/privacy" className="text-blue-700 underline">{copy.privacy}</Link> · <Link href="/refunds" className="text-blue-700 underline">{copy.refunds}</Link></p></header>
    {feeEnabled && !paymentAvailable && !waived && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{copy.paymentUnavailable.a}<Link href="/contact" className="underline">{copy.paymentUnavailable.link}</Link>{copy.paymentUnavailable.b}</div>}
    {feeIntroducedSinceDraft && feeEnabled && <div role="note" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">{copy.feeIntroduced(APPLICATION_CHARGE_LABEL)}</div>}
    {earlierPayment === 'checking' && <div role="status" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">{copy.checkoutVerifying}</div>}
    {earlierPayment === 'wait' && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm"><span>{copy.checkoutWaiting}</span><button type="button" onClick={() => { setEarlierPayment('checking'); setRecheck(value => value + 1); }} className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800">{copy.checkAgain}</button></div>}
    {earlierPayment === 'review' && <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{copy.checkoutRestored.a}<Link href="/contact" className="underline">{copy.checkoutRestored.link}</Link>{copy.checkoutRestored.b}</div>}
    <ol aria-label={copy.progress} className="mb-5 grid grid-cols-3 gap-2">{[copy.progressSteps[0], copy.progressSteps[1], feeEnabled && !waived ? copy.progressSteps[2] : copy.free.step3].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`rounded-xl border px-3 py-3 text-xs font-semibold sm:text-sm ${step === index + 1 ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>{index + 1}. {label}</li>)}</ol>
    {!checkoutStarted && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs"><span role="status" className={saveState === 'error' ? 'text-red-700' : 'text-slate-600'}>{saveState === 'saving' ? copy.saving : saveState === 'unsaved' ? copy.unsaved : saveState === 'error' ? saveError : savedAt ? copy.savedAt(new Date(savedAt).toLocaleTimeString()) : copy.autosave}</span><button type="button" onClick={() => void persist(form, step, revision.current)} disabled={saveState === 'saving' || busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold disabled:opacity-50">{copy.saveDraft}</button></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><h2 ref={titleRef} tabIndex={-1} className="mb-6 text-xl font-bold text-slate-900 outline-none">{copy.headings[step - 1]}</h2>
      {reviewMode && <div role="note" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">{copy.review.banner}</div>}
      {step === 3 && feeEnabled && !waived && <p className="-mt-3 mb-5 text-sm text-slate-600">{copy.pay.lead}</p>}
      {notice && !(step === 3 && feeEnabled) && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{notice}</div>}
      {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
        {parentApplying && <p className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-950 sm:col-span-2">{copy.parentApplying.a}<strong>{copy.parentApplying.strong}</strong>{copy.parentApplying.b}</p>}
        {field('studentLevel', { choices: [['SCHOOL',copy.schoolStudent],['UNIVERSITY',copy.universityStudent]] })}{field('school')}
        {field('residenceCountry', { choices: COUNTRY_CODES.map(code => [code, countryName(code, locale)]) })}
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
      {step === 3 && <div className="space-y-6">{[1,2].map(section => <div key={section} className="rounded-xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">{section === 1 ? copy.headings[0] : copy.headings[1]}</h3>{!checkoutStarted && <button type="button" disabled={busy} onClick={() => move(section)} className="text-sm font-semibold text-blue-700 underline">{section === 1 ? copy.editPersonal : copy.editResearch}</button>}</div><dl className="space-y-4">{Object.keys(applicationLabels).filter(key => personalFields.includes(key) === (section === 1)).filter(key => !(form.studentLevel === 'UNIVERSITY' && key.startsWith('parent')) && !(key === 'tShirtSize' && !summer)).map(key => <div key={key}><dt className="text-xs font-semibold text-slate-500">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900">{key === 'resumeUrl' ? <a href={form[key]} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{filename || copy.viewPdf}</a> : key === 'studentLevel' ? form[key] === 'UNIVERSITY' ? copy.universityStudent : copy.schoolStudent : key === 'residenceCountry' && form[key] ? countryName(form[key] as (typeof COUNTRY_CODES)[number], locale) : form[key] || copy.notProvided}</dd></div>)}</dl></div>)}
        {!feeEnabled && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm font-semibold text-emerald-900">{copy.free.box.title}</p><p className="mt-2 text-sm leading-relaxed text-emerald-900/80">{copy.free.box.body}</p></div>}
        {feeEnabled && <section aria-labelledby={`${widgetId}summary`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Order summary first, then how to pay: the order a US checkout uses, with the total and currency unambiguous. */}
          <div className="border-b border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h3 id={`${widgetId}summary`} className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.pay.summaryTitle}</h3>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0"><p className="font-semibold text-slate-900">{copy.pay.item}</p><p className="mt-0.5 break-words text-sm text-slate-600">{program.title}</p><p className="mt-1 text-xs text-slate-500">{copy.pay.itemNote}</p></div>
              <p className="shrink-0 font-semibold tabular-nums text-slate-900">{APPLICATION_CHARGE_PRICE}</p>
            </div>
            {feeCode && <div className="mt-3 flex items-start justify-between gap-4 text-sm">
              <p className="min-w-0 break-words text-emerald-800">{copy.pay.codeApplied(feeCode.code)} {!checkoutStarted && <button id={`${widgetId}coderemove`} type="button" onClick={removeCode} disabled={busy} className="ml-1 text-xs font-semibold text-slate-500 underline">{copy.pay.codeRemove}</button>}</p>
              <p className="shrink-0 font-semibold tabular-nums text-emerald-800">−{dollars(APPLICATION_CHARGE.amount - due)}</p>
            </div>}
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-4">
              <p className="font-semibold text-slate-900">{copy.pay.total}</p>
              <p aria-live="polite" className="text-2xl font-bold tabular-nums text-slate-900">{dollars(due)} <span className="text-sm font-semibold text-slate-500">{APPLICATION_CHARGE.currency}</span></p>
            </div>
            {waived && <p role="status" className="mt-2 text-sm text-emerald-800">{copy.pay.waivedNote}</p>}
            {!waived && user.email && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Mail aria-hidden className="h-3.5 w-3.5 shrink-0 text-slate-400" />{copy.pay.receipt(user.email)}</p>}
            {/* Behind a link, so nobody without a code feels they are missing a discount. */}
            {!feeCode && !checkoutStarted && (codeOpen ? (
              <div className="mt-4">
                <label htmlFor={`${widgetId}code`} className="mb-1 block text-xs font-semibold text-slate-700">{copy.pay.codeLabel}</label>
                <div className="flex gap-2">
                  <input id={`${widgetId}code`} value={codeInput} onChange={event => { setCodeInput(event.target.value); setCodeError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void applyCode(); } }} maxLength={32} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={`${widgetId}codehelp`} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base uppercase text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:text-sm" />
                  <button type="button" onClick={() => void applyCode()} disabled={codeBusy || busy || !codeInput.trim()} className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-50">{codeBusy ? copy.pay.codeChecking : copy.pay.codeApply}</button>
                </div>
                <p id={`${widgetId}codehelp`} className={`mt-1 text-xs ${codeError ? 'text-red-700' : 'text-slate-500'}`} role={codeError ? 'alert' : undefined}>{codeError || copy.pay.codeHelp}</p>
              </div>
            ) : (
              <button id={`${widgetId}codelink`} type="button" onClick={() => { setCodeOpen(true); requestAnimationFrame(() => document.getElementById(`${widgetId}code`)?.focus()); }} className="mt-3 text-xs font-semibold text-blue-700 underline">{copy.pay.codeLink}</button>
            ))}
          </div>
          {!waived && <div className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.pay.methodTitle}</h3>
            <div className="mt-3 rounded-xl border border-slate-200 p-1">
              {widgetState === 'loading' && <p role="status" className="px-3 py-6 text-center text-sm text-slate-500">{copy.widget.loading}</p>}
              {widgetState === 'error' && <p role="alert" className="px-3 py-6 text-center text-sm text-red-700">{copy.widget.failed}</p>}
              <div id={methodsId} />
              <div id={agreementId} />
            </div>
            {(locale === 'ko' || form.residenceCountry === 'KR') && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">{copy.pay.koreanCard}</p>}
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-slate-600"><Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{copy.pay.secure}</span></p>
          </div>}
        </section>}
      </div>}
      {step === 3 && feeEnabled && notice && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{notice}</div>}
      {step === 3 && feeEnabled && !waived && <p className="mt-6 text-xs leading-relaxed text-slate-600">{copy.pay.billed(dollars(due), COMPANY.legalName)}</p>}
      <div className={`${step === 3 && feeEnabled ? 'mt-4' : 'mt-8'} flex flex-wrap items-center justify-between gap-3`}>{step > 1 && !checkoutStarted ? <button type="button" disabled={busy} onClick={() => move(step - 1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">{copy.backButton}</button> : <span />}{step < 3 ? <button type="button" disabled={uploading} onClick={() => move(step + 1)} className={actionClass}>{step === 1 ? copy.continueResearch : copy.reviewApplication}</button> : (feeEnabled && waived ? <button type="button" onClick={() => void submitFree(feeCode?.code)} disabled={busy || codeBusy || codeRestoring || earlierPayment !== 'none'} className={actionClass}>{busy ? copy.free.submitting : copy.pay.submitWaived}</button> : feeEnabled ? <button type="button" onClick={() => void checkout()} disabled={busy || codeBusy || codeRestoring || !paymentAvailable || widgetState !== 'ready' || earlierPayment !== 'none'} className={`${actionClass} inline-flex items-center justify-center gap-2`}><Lock aria-hidden className="h-4 w-4" />{busy ? copy.pay.processing : payMethod === 'paypal' ? copy.pay.continuePaypal : copy.pay.button(dollars(due))}</button> : <button type="button" onClick={() => void submitFree()} disabled={busy || earlierPayment !== 'none'} className={actionClass}>{busy ? copy.free.submitting : copy.free.submit}</button>)}</div>
      {step === 3 && feeEnabled && !waived && <div className="mt-3 space-y-1 text-right text-xs leading-relaxed text-slate-500">
        <p>{payMethod === 'paypal' ? copy.pay.paypalHelper(dollars(due)) : copy.pay.cardHelper}</p>
        <p>{copy.pay.legalA}<Link href="/terms" className="underline">{copy.pay.terms}</Link>{copy.pay.legalAnd}<Link href="/refunds" className="underline">{copy.pay.refunds}</Link>{copy.pay.legalB}<Link href="/privacy" className="underline">{copy.pay.privacy}</Link>{copy.pay.legalC}</p>
        <p>{copy.pay.refundNote}</p>
      </div>}
      <p className="mt-6 text-xs leading-relaxed text-slate-500">{copy.help.a}<a href="mailto:support@cri.kr" className="underline">support@cri.kr</a>{copy.help.b}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{copy.adsNote}</p>
    </section>
  </div></div>;
}
