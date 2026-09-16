/**
 * Rekalla himself: a pink cartoon brain, and the app's mascot. He is also the
 * mark every icon is drawn from, so the face on the home screen is literally
 * the same drawing as the one inside the app.
 *
 * He is built as one half, drawn twice. Every fold is defined for his left side
 * only; his right side is that same group under a mirror transform, so the two
 * halves cannot drift apart. The outline is mirror-exact the same way: each
 * control point on the right is 100 minus its partner on the left. Edit
 * LEFT_FOLDS, never a right-hand copy.
 *
 * The geometry below is shared three ways: with the React Native version in
 * mobile/components/rekalla-avatar.tsx, and with scripts/make-icons.mjs, which
 * redraws every app icon from it. Change his shape here, then run that script
 * and mirror the edit into the mobile file. Keep all three in step.
 */
export const BODY = "#f7a8c8"; // brain pink
export const FOLD = "#d4779f"; // the sulci, a deeper pink
export const INK = "#43202f"; // his eyes and his smile

/** Ten lobes, mirrored about x = 50. */
export const OUTLINE =
  "M50 10C62 6 74 10 76 20C88 18 94 28 88 38C96 44 96 56 86 60C92 70 84 80 73 76C70 86 60 90 50 86C40 90 30 86 27 76C16 80 8 70 14 60C4 56 4 44 12 38C6 28 12 18 24 20C26 10 38 6 50 10Z";

/** The folds on his left side. His right side is this list, mirrored. */
export const LEFT_FOLDS = [
  "M32 26C26 30 28 36 22 40",
  "M14 52C22 50 24 56 20 62",
  "M30 74C34 70 30 66 34 62",
];

/** Reflects the left half onto the right. */
export const MIRROR = "translate(100, 0) scale(-1, 1)";

export function RekallaAvatar({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Rekalla"
      className={className}
    >
      <path d={OUTLINE} fill={BODY} />

      {/* His left folds, then that same group mirrored onto his right */}
      <g stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
        {LEFT_FOLDS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g
        stroke={FOLD}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        transform={MIRROR}
      >
        {LEFT_FOLDS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {/* The one fold that sits on the centre line, so it is drawn once */}
      <path
        d="M50 14V36"
        stroke={FOLD}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />

      <circle cx={40} cy={52} r={4.5} fill={INK} />
      <circle cx={60} cy={52} r={4.5} fill={INK} />
      <path
        d="M42 64C45 68 55 68 58 64"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
