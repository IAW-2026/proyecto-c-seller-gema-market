export type AvatarProps = {
  name?: string;
  size?: number;
};

const PALETTE = ["#a4ac86", "#7f4f24", "#656d4a", "#936639", "#414833"] as const;

export function Avatar({ name = "", size = 40 }: AvatarProps) {
  const initials =
    name
      .split(" ")
      .map((s) => s[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const seed = name.length > 0 ? name.charCodeAt(0) : 0;
  const color = PALETTE[seed % PALETTE.length] ?? PALETTE[0];
  return (
    <div
      aria-hidden="true"
      className="rounded-full text-paper flex items-center justify-center font-semibold tracking-[0.02em] shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
