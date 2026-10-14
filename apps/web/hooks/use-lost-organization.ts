"use client";

import { useSyncExternalStore } from "react";

import {
  readDismissedLostOrganizationId,
  writeDismissedLostOrganizationId,
} from "@/lib/lost-organization";

const listeners = new Set<() => void>();

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSnapshot = () => readDismissedLostOrganizationId(window.localStorage);

const getServerSnapshot = () => undefined;

const dismissLostOrganization = (organizationId: string) => {
  writeDismissedLostOrganizationId(window.localStorage, organizationId);
  listeners.forEach((listener) => listener());
};

export const useLostOrganizationDismissal = () =>
  [
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
    dismissLostOrganization,
  ] as const;
