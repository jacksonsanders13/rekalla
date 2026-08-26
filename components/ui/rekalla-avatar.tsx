/**
 * Rekalla himself: a friendly cartoon brain. He introduces the app and stands
 * next to every answer he gives, so the voice you're reading has a face.
 *
 * Geometry is shared with the mobile version in
 * mobile/components/rekalla-avatar.tsx. Keep the two in step.
 */
const BODY = "#ededf2";
const FOLD = "#c3c3ce";
const INK = "#1c1c1e";
const BLUE = "#0a84ff";

export type AvatarBadge = "camera" | "calendar" | "bell";

export function RekallaAvatar({
  size = 96,
  badge,
  className,
}: {
  size?: number;
  badge?: AvatarBadge;
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
      <path
        d="M50 12C34 12 22 22 22 34C14 38 12 48 18 55C14 62 18 72 27 75C30 84 40 88 50 85C60 88 70 84 73 75C82 72 86 62 82 55C88 48 86 38 78 34C78 22 66 12 50 12Z"
        fill={BODY}
      />
      <g stroke={FOLD} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M50 14C50 21 44 23 44 29" />
        <path d="M36 21C30 27 32 33 28 37" />
        <path d="M64 21C70 27 68 33 72 37" />
        <path d="M20 53C26 51 30 55 30 59" />
        <path d="M80 53C74 51 70 55 70 59" />
      </g>
      <circle cx={40} cy={52} r={4.5} fill={INK} />
      <circle cx={60} cy={52} r={4.5} fill={INK} />
      <path
        d="M42 64C45 68 55 68 58 64"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />

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
