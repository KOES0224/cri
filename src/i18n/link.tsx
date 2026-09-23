"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useT } from "./client";
import { localizeHref } from "./routing";

/**
 * next/link that keeps visitors on the Korean URLs (`/ko/...`) while the page is in Korean.
 * Use it for every link on public pages so crawlers can follow the Korean site.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useT();
  return <NextLink href={typeof href === "string" ? localizeHref(href, locale) : href} {...props} />;
}
