/**
 * The four kinds of thing you can add, and the questions each one asks.
 *
 * Adding something is a guided form with one field to a screen, never a blank
 * card to design. That is a deliberate limit: it keeps every prompt phrased
 * the same way, it means nobody has to invent a good question about their own
 * life on the spot, and it is what makes the questions answerable without a
 * model to grade them.
 *
 * Every field says what it is for. A form that asks for four things and
 * explains none of them is a form people quit, and it is also the shape of
 * every scam this audience gets warned about.
 */
import type { ItemCategory } from "./types";

export interface TemplateField {
  key: string;
  /** The whole screen's heading. Asked as a question. */
  question: string;
  /** Rekalla, above the field, saying what he will do with the answer. */
  explain: string;
  hint?: string;
  kind: "photo" | "text";
  placeholder?: string;
  /** A screen that can be passed over, like a photo or an extra line. */
  optional?: boolean;
}

export interface CategoryTemplate {
  category: ItemCategory;
  /** On the picker. */
  label: string;
  /** Under the label on the picker. */
  blurb: string;
  fields: TemplateField[];
  buildPrompt(values: Record<string, string>): string;
  buildAnswer(values: Record<string, string>): string;
}

function detailField(example: string, explain: string): TemplateField {
  return {
    key: "detail",
    question: "Anything to add?",
    explain,
    hint: "One line, shown when you get it right.",
    kind: "text",
    placeholder: example,
    optional: true,
  };
}

export const TEMPLATES: Record<ItemCategory, CategoryTemplate> = {
  person: {
    category: "person",
    label: "A person",
    blurb: "Photo, name, and who they are to you",
    fields: [
      {
        key: "photo",
        question: "Add a photo",
        explain: "I'll show you this photo and ask who it is. That's the main exercise.",
        hint: "A clear photo of their face works best. You can skip this.",
        kind: "photo",
        optional: true,
      },
      {
        key: "name",
        question: "What is their name?",
        explain:
          "This is the answer you'll pick out. Use whatever you actually call them, not their full name.",
        kind: "text",
        placeholder: "Ellie",
      },
      {
        key: "relationship",
        question: "Who are they to you?",
        explain:
          "So I can ask about this too, and so I know where to put them on your family tree.",
        hint: "For example: granddaughter, son, neighbor.",
        kind: "text",
        placeholder: "Granddaughter",
      },
      detailField(
        "She plays violin and lives in Denver",
        "I'll show this when you get them right. It gives the name something to stick to.",
      ),
    ],
    buildPrompt: () => "Who is this?",
    buildAnswer: (values) => values.name?.trim() ?? "",
  },

  routine: {
    category: "routine",
    label: "Something you do",
    blurb: "Something you do, and when",
    fields: [
      {
        key: "cue",
        question: "When does it happen?",
        explain:
          "This becomes the question. Something that already happens every day works best.",
        hint: "For example: after breakfast, before bed.",
        kind: "text",
        placeholder: "After breakfast",
      },
      {
        key: "action",
        question: "What do you do then?",
        explain: "This is the answer.",
        kind: "text",
        placeholder: "Take the dog out",
      },
      detailField(
        "His leash is on the hook by the back door",
        "Anything that helps in the moment.",
      ),
    ],
    buildPrompt: (values) => `What do you do ${values.cue?.trim().toLowerCase()}?`,
    buildAnswer: (values) => values.action?.trim() ?? "",
  },

  place: {
    category: "place",
    label: "Where something is kept",
    blurb: "The things you go looking for",
    fields: [
      {
        key: "thing",
        question: "What is it?",
        explain: "Something you go looking for. I'll ask you where it is.",
        hint: "For example: your keys, your reading glasses.",
        kind: "text",
        placeholder: "My keys",
      },
      {
        key: "place",
        question: "Where do you keep it?",
        explain:
          "This is the answer. If it doesn't have a spot yet, pick one now.",
        kind: "text",
        placeholder: "In the blue bowl by the front door",
      },
      detailField(
        "I put them there as soon as I come in",
        "Anything that makes it stick.",
      ),
    ],
    buildPrompt: (values) => `Where do you keep ${values.thing?.trim().toLowerCase()}?`,
    buildAnswer: (values) => values.place?.trim() ?? "",
  },

  fact: {
    category: "fact",
    label: "Something worth knowing",
    blurb: "An address, a phone number, a date",
    fields: [
      {
        key: "subject",
        question: "What do you want to remember?",
        explain: "This becomes the question I ask you.",
        hint: "For example: my address, my daughter's phone number.",
        kind: "text",
        placeholder: "My address",
      },
      {
        key: "value",
        question: "What's the answer?",
        explain: "The answer, exactly as you'd say it out loud.",
        kind: "text",
        placeholder: "1412 Oak Street, Denver",
      },
      detailField(
        "The green door, second house down",
        "Anything else worth remembering.",
      ),
    ],
    buildPrompt: (values) => `What is ${values.subject?.trim().toLowerCase()}?`,
    buildAnswer: (values) => values.value?.trim() ?? "",
  },
};

export const CATEGORY_ORDER: ItemCategory[] = ["person", "routine", "place", "fact"];

/** The fields that have to be filled in before an item can be saved. */
export function requiredFields(template: CategoryTemplate): TemplateField[] {
  return template.fields.filter((field) => !field.optional);
}
