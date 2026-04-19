/** Même libellé que calendrier / liste : portion « from … to … » en « Origine → Destination ». */
export function shortTitle(title: string): string {
  const match = title.match(/from (.+)$/i);
  return match ? match[1].replace(" to ", " → ") : title;
}
