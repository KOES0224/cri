"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, getDictionary, type Dictionary, type Locale } from "./config";

type LocaleContextValue = { locale: Locale; t: Dictionary };

const LocaleContext = createContext<LocaleContextValue>({ locale: DEFAULT_LOCALE, t: getDictionary(DEFAULT_LOCALE) });

/** Rendered once by the root layout with the server-detected locale. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: getDictionary(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Returns the current dictionary and locale for client components. */
export function useT(): LocaleContextValue {
  return useContext(LocaleContext);
}
