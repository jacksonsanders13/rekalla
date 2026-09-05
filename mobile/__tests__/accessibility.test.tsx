/**
 * What VoiceOver would hear, and what happens at the largest text size.
 *
 * These render the pieces every screen is built from, inside the providers,
 * with the in-app text scale turned all the way up. What they can prove is
 * that every control introduces itself, that a state change is announced
 * rather than just coloured, and that nothing throws when the type doubles.
 *
 * What they cannot prove is that nothing is clipped: there is no layout engine
 * here, so a box that would overflow on a real phone still renders happily.
 * That is what the device pass in docs/v3-plan.md is for. These catch the
 * regressions; a person with VoiceOver on catches the rest.
 */
import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { ThemeProvider } from "../lib/design/theme";
import { TextScaleProvider, TEXT_SCALE_CHOICES } from "../lib/design/text-scale";
import { ChunkyButton } from "../components/practice/chunky-button";
import { OptionButton } from "../components/practice/option-button";
import { ChoiceRow } from "../components/practice/choice-row";
import { Field } from "../components/practice/field";
import { PersonNode } from "../components/practice/person-node";
import { AppText } from "../components/practice/text";
import { type as typeScale } from "../lib/design/tokens";

/** The largest the app itself offers, on top of whatever iOS is doing. */
const LARGEST = TEXT_SCALE_CHOICES[TEXT_SCALE_CHOICES.length - 1].value;

function atLargestSize(children: ReactNode, theme: "dark" | "light" = "dark") {
  return render(
    <ThemeProvider name={theme}>
      <TextScaleProvider scale={LARGEST}>{children}</TextScaleProvider>
    </ThemeProvider>,
  );
}

describe("every control says what it is", () => {
  it("a button carries its label and its role", () => {
    atLargestSize(<ChunkyButton label="Practise" onPress={() => {}} />);
    expect(screen.getByRole("button", { name: "Practise" })).toBeTruthy();
  });

  it("a disabled button still announces itself, and says it is disabled", () => {
    atLargestSize(<ChunkyButton label="Continue" onPress={() => {}} disabled />);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it("a field labels both the input and the control that reveals it", () => {
    atLargestSize(
      <Field label="Your password" value="rosemary47" onChangeText={() => {}} secure />,
    );
    expect(screen.getByLabelText("Your password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hide the password" })).toBeTruthy();
  });

  it("a person node says who they are and how settled, never a score", () => {
    atLargestSize(
      <PersonNode name="Ellie" sublabel="granddaughter" progress={0.5} onPress={() => {}} />,
    );
    const node = screen.getByRole("button", { name: /Ellie/ });
    expect(node.props.accessibilityLabel).toBe("Ellie. granddaughter. coming along");
    expect(node.props.accessibilityLabel).not.toMatch(/\d/);
  });
});

describe("state is announced, not only coloured", () => {
  it("a chosen row reports itself as checked", () => {
    atLargestSize(<ChoiceRow label="The people in my life" selected onPress={() => {}} />);
    const row = screen.getByRole("checkbox", { name: /The people in my life/ });
    expect(row.props.accessibilityState.checked).toBe(true);
  });

  it("the right answer is spoken as correct", () => {
    atLargestSize(
      <OptionButton label="Ellie" state="chosen-correct" onPress={() => {}} disabled />,
    );
    expect(screen.getByRole("button", { name: "Ellie. Correct" })).toBeTruthy();
  });

  it("after a miss, the answer introduces itself as the answer", () => {
    atLargestSize(
      <OptionButton label="Ellie" state="shown-answer" onPress={() => {}} disabled />,
    );
    expect(screen.getByRole("button", { name: "Ellie. This is the answer" })).toBeTruthy();
  });

  it("the option somebody tapped by mistake is never called wrong", () => {
    atLargestSize(
      <OptionButton label="Anna" state="chosen-other" onPress={() => {}} disabled />,
    );
    const spoken = screen.getByRole("button", { name: /Anna/ }).props.accessibilityLabel;
    expect(spoken).toBe("Anna. You chose this one");
    expect(spoken).not.toMatch(/wrong|incorrect|error|failed/i);
  });
});

describe("the largest text size", () => {
  it("scales body text past the floor rather than capping it", () => {
    atLargestSize(<AppText>Who is this?</AppText>);
    const text = screen.getByText("Who is this?");
    const style = Array.isArray(text.props.style) ? text.props.style[0] : text.props.style;
    expect(style.fontSize).toBe(Math.round(typeScale.body * LARGEST));
    expect(style.fontSize).toBeGreaterThan(typeScale.body);
  });

  it("leaves font scaling on, so iOS can enlarge it again on top", () => {
    atLargestSize(<AppText>Who is this?</AppText>);
    expect(screen.getByText("Who is this?").props.allowFontScaling).not.toBe(false);
  });

  it("renders in both palettes without throwing", () => {
    for (const theme of ["dark", "light"] as const) {
      const view = atLargestSize(
        <ChunkyButton label="Practise" onPress={() => {}} />,
        theme,
      );
      expect(view.toJSON()).toBeTruthy();
      view.unmount();
    }
  });
});
