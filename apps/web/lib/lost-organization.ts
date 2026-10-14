// El aviso "Ya no formás parte de..." recuerda dos cosas por dispositivo, cada una en su
// propia clave: la organización perdida que ya se cerró (no reaparece) y la que ya empujó al
// usuario al inicio (no lo hace una segunda vez si vuelve a navegar a otra pantalla).
export const lostOrganizationDismissedStorageKey = "organizations.lostDismissed";
export const lostOrganizationRedirectedStorageKey = "organizations.lostRedirected";

const readId = (storage: Pick<Storage, "getItem">, key: string) => {
  try {
    return storage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeId = (storage: Pick<Storage, "setItem">, key: string, id: string) => {
  try {
    storage.setItem(key, id);
  } catch {
    return;
  }
};

export const readDismissedLostOrganizationId = (storage: Pick<Storage, "getItem">) =>
  readId(storage, lostOrganizationDismissedStorageKey);

export const writeDismissedLostOrganizationId = (
  storage: Pick<Storage, "setItem">,
  organizationId: string,
) => writeId(storage, lostOrganizationDismissedStorageKey, organizationId);

export const readRedirectedLostOrganizationId = (storage: Pick<Storage, "getItem">) =>
  readId(storage, lostOrganizationRedirectedStorageKey);

export const writeRedirectedLostOrganizationId = (
  storage: Pick<Storage, "setItem">,
  organizationId: string,
) => writeId(storage, lostOrganizationRedirectedStorageKey, organizationId);
