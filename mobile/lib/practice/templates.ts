/**
 * The four kinds of thing you can add, and the questions each one asks.
 *
 * Adding something is a guided form with one field to a screen, never a blank
 * card to design. That is a deliberate limit: it keeps every prompt phrased
 * the same way, it means nobody has to invent a good question about their own
 * life on the spot, and it is what makes the questions answerable without a
 * model to grade them.
 *
 * Every field carries a line from Rekalla saying what he wants it for. A form
 * that collects four things and explains none of them is a form people give
 * up on, and it is also the shape of every scam this audience is warned
 * about. Saying why is not decoration here.
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
    question: "Anything you would like me to say back?",
    explain,
    hint: "One line. You will see it when you get the answer right.",
    kind: "text",
    placeholder: example,
    optional: true,
  };
}

export const TEMPLATES: Record<ItemCategory, CategoryTemplate> = {
  person: {
    category: "person",
    label: "A person",
    blurb: "Their photo, their name, and who they are to you",
    fields: [
      {
        key: "photo",
        question: "Add a photo",
        explain:
          "A photo is the thing I lean on most. I will show it to you and ask who it is, which is the whole exercise really.",
        hint: "A clear picture of their face works best. You can add one later instead.",
        kind: "photo",
        optional: true,
      },
      {
        key: "name",
        question: "What is their name?",
        explain:
          "This is the answer you will be picking out. Whatever you actually call them is the right thing to put, not their full name on paper.",
        kind: "text",
        placeholder: "Ellie",
      },
      {
        key: "relationship",
        question: "Who are they to you?",
        explain:
          "Two reasons. I can ask you about it as well as their name, and it tells me where to put them on your family tree.",
        hint: "For example: granddaughter, son, neighbour.",
        kind: "text",
        placeholder: "Granddaughter",
      },
      detailField(
        "She lives in Leeds and plays the violin",
        "When you get them right, I will say this back to you. It is nice to hear, and it gives the name something to hang on.",
      ),
    ],
    buildPrompt: () => "Who is this?",
    buildAnswer: (values) => values.name?.trim() ?? "",
  },

  routine: {
    category: "routine",
    label: "Something you do",
    blurb: "A part of your day, and when it happens",
    fields: [
      {
        key: "cue",
        question: "When does it happen?",
        explain:
          "I will use this as the question. Something that already happens every day works best, because that is what reminds you.",
        hint: "For example: after breakfast, before bed.",
        kind: "text",
        placeholder: "After breakfast",
      },
      {
        key: "action",
        question: "What do you do then?",
        explain: "And this is the answer you will be picking out.",
        kind: "text",
        placeholder: "Take the dog out",
      },
      detailField(
        "His lead is on the hook by the back door",
        "Anything that helps when the moment comes. I will say it back when you get it right.",
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
        explain:
          "The thing you find yourself hunting for. I will ask you where it lives.",
        hint: "For example: your keys, your reading glasses.",
        kind: "text",
        placeholder: "My keys",
      },
      {
        key: "place",
        question: "Where do you keep it?",
        explain:
          "This is the answer. Worth putting where you would like it to live, if it does not have a home yet.",
        kind: "text",
        placeholder: "In the blue bowl by the front door",
      },
      detailField(
        "I put them there as soon as I come in",
        "Anything that makes it stick. I will say it back when you get it right.",
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
        question: "What is it you want to remember?",
        explain: "I will turn this into the question I ask you.",
        hint: "For example: my address, my daughter's phone number.",
        kind: "text",
        placeholder: "My address",
      },
      {
        key: "value",
        question: "And what is the answer?",
        explain:
          "Exactly as you would want to say it. This is what you will be picking out.",
        kind: "text",
        placeholder: "14 Mill Lane, Harrogate",
      },
      detailField(
        "The green door, second house along",
        "Anything else worth hearing. I will say it back when you get it right.",
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
