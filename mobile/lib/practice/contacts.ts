/**
 * Bringing people in from the address book.
 *
 * The fastest way to fill a family tree is not to type it. The phone already
 * holds the names, often the photos, and — in the name itself — usually the
 * relationship, because people save family under what they call them.
 *
 * One thing this deliberately does not use is the phone's own relationship
 * field. On iOS a related name stored against a contact describes that
 * contact's relatives: "mother" on Jane's card means Jane's mother, not that
 * Jane is your mother. It is the wrong way round for what we need, so the
 * name is read instead and anything unreadable is asked about.
 *
 * Nothing is imported without being ticked. The address book is read, shown,
 * and forgotten unless somebody chooses to keep a person.
 */
import * as Contacts from "expo-contacts";
import * as ImageManipulator from "expo-image-manipulator";
import { readContactName } from "./relations";
import type { Placement } from "./relations";
import { inferPlacement } from "./relations";

/** Face photos are shown large; anything past this is wasted bytes. */
const MAX_EDGE = 900;

export interface ImportableContact {
  id: string;
  /** What to call them in a question, with any relationship word taken out. */
  name: string;
  /** As it appears in the address book, for recognising them in the list. */
  rawName: string;
  /** Read out of the name where possible, otherwise null and we ask. */
  relationship: string | null;
  placement: Placement | null;
  /** Local uri, only for showing the list. Encoded on import, not before. */
  photoUri: string | null;
}

export type ContactsOutcome =
  | { status: "ok"; contacts: ImportableContact[] }
  | { status: "blocked" };

/**
 * Reads the address book. Sorted so the people most likely to be family come
 * first: a relationship in the name, then a photo, then everyone else
 * alphabetically. A list of four hundred contacts in the order the phone
 * happens to hold them is a list nobody gets through.
 */
export async function loadImportableContacts(): Promise<ContactsOutcome> {
  const permission = await Contacts.requestPermissionsAsync();
  if (!permission.granted) return { status: "blocked" };

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.Image],
  });

  const contacts: ImportableContact[] = [];
  for (const contact of data) {
    const rawName = (contact.name ?? "").trim();
    if (!rawName) continue;

    const reading = readContactName(rawName);
    contacts.push({
      id: contact.id ?? rawName,
      name: reading.displayName,
      rawName,
      relationship: reading.relationship,
      placement: inferPlacement(reading.relationship),
      photoUri: contact.image?.uri ?? null,
    });
  }

  const rank = (c: ImportableContact) =>
    (c.relationship ? 0 : 2) + (c.photoUri ? 0 : 1);

  contacts.sort(
    (a, b) => rank(a) - rank(b) || a.rawName.localeCompare(b.rawName),
  );

  return { status: "ok", contacts };
}

/**
 * Encodes one contact's photo, at import time rather than at list time. A
 * list of four hundred contacts should not read four hundred images off disk
 * to show a screen somebody is about to leave.
 */
export async function encodeContactPhoto(uri: string): Promise<string | null> {
  try {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_EDGE } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return out.base64 ?? null;
  } catch {
    // A contact photo that will not encode is not a reason to lose the person.
    return null;
  }
}
