/**
 * Rekalla himself: a pink cartoon brain. He greets you on Home and stands next
 * to every answer he gives.
 *
 * `pose` changes what he's doing (waving hello, thinking about your question).
 * Geometry is shared with the mobile version in
 * mobile/components/rekalla-avatar.tsx. Keep the two in step.
 */
const BODY = "#f7a8c8"; // brain pink
const FOLD = "#d4779f"; // the sulci, a deeper pink
const INK = "#43202f";
const CLOUD = "#fdeef4"; // the thought bubble, a near-white pink
const BLUE = "#0a84ff";

export type AvatarBadge = "camera" | "calendar" | "bell";
export type AvatarPose = "idle" | "wave" | "think";

/** The lobed outline. Ten bumps is what reads as "brain" rather than "cloud". */
const OUTLINE =
  "M50 14C60 8 72 12 74 22C84 20 92 28 88 38C96 44 94 56 86 60C90 70 82 79 73 76C70 86 58 90 50 84C42 90 30 86 27 76C18 79 10 70 14 60C6 56 4 44 12 38C8 28 16 20 26 22C28 12 40 8 50 14Z";

export function RekallaAvatar({
  size = 96,
  pose = "idle",
  badge,
  className,
}: {
  size?: number;
  pose?: AvatarPose;
  badge?: AvatarBadge;
  className?: string;
}) {
  const thinking = pose === "think";
  const eyeY = thinking ? 50 : 52;
  const eyeX = thinking ? 2 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label={thinking ? "Rekalla is thinking" : "Rekalla"}
      className={className}
    >
      {/* Arm goes behind the head so it reads as coming from behind him. */}
      {pose === "wave" && (
        <g>
          <path
            d="M84 62C91 58 94 48 92 41"
            stroke={BODY}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={92} cy={37} r={6.5} fill={BODY} />
        </g>
      )}

      <path d={OUTLINE} fill={BODY} />

      <g stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M50 16C52 24 48 28 50 36" />
        <path d="M32 26C26 30 28 36 22 40" />
        <path d="M68 26C74 30 72 36 78 40" />
        <path d="M14 52C22 50 24 56 20 62" />
        <path d="M86 52C78 50 76 56 80 62" />
        <path d="M30 74C34 70 30 66 34 62" />
        <path d="M70 74C66 70 70 66 66 62" />
      </g>

      <circle cx={40 + eyeX} cy={eyeY} r={4.5} fill={INK} />
      <circle cx={60 + eyeX} cy={eyeY} r={4.5} fill={INK} />
      <path
        d={thinking ? "M45 66C48 64 52 64 54 66" : "M42 64C45 68 55 68 58 64"}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />

      {thinking && (
        <g>
          <circle cx={70} cy={18} r={2.2} fill={CLOUD} />
          <g fill={CLOUD}>
            <circle cx={74} cy={9} r={6} />
            <circle cx={84} cy={6} r={7} />
            <circle cx={93} cy={10} r={5} />
          </g>
          <g fill={INK}>
            <circle cx={78} cy={8} r={1.7} />
            <circle cx={84} cy={6} r={1.7} />
            <circle cx={90} cy={8} r={1.7} />
          </g>
        </g>
      )}

      {badge && (
        <g>
          <circle cx={78} cy={78} r={19} fill={BLUE} />
          <g
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {badge === "camera" && (
              <>
                <rect x={68} y={72} width={20} height={14} rx={3} />
                <circle cx={78} cy={79} r={3.5} />
                <path d="M74 72L76 69H80L82 72" />
              </>
            )}
            {badge === "calendar" && (
              <>
                <rect x={68} y={70} width={20} height={17} rx={3} />
                <path d="M68 76H88M73 67V71M83 67V71" />
              </>
            )}
            {badge === "bell" && (
              <>
                <path d="M71 83C74 80 73 78 73 75C73 71 75 68 78 68C81 68 83 71 83 75C83 78 82 80 85 83Z" />
                <path d="M76 86H80" />
              </>
            )}
          </g>
        </g>
      )}
    </svg>
  );
}

/** A rounded speech bubble with a tail pointing left, at Rekalla. */
export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1">
      <span className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 bg-elev-1" />
      <div className="relative rounded-2xl bg-elev-1 px-4 py-3 text-lg leading-relaxed text-label">
        {children}
      </div>
    </div>
  );
}
