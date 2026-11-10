// Checks that JSON Schema cannot express. Used by scripts/build.mjs and worker/src/index.js.
// site/app.js has a copy of INVITE_RE; keep the two in sync.

// Links that let anyone join a private group. Admins of private groups often do not want them public.
export const INVITE_RE = /(?:t\.me|telegram\.me|telegram\.dog)\/(?:\+|joinchat\/)|chat\.whatsapp\.com\/|invite\.viber\.com|discord\.gg\/|discord\.com\/invite\//i;

export function extraChecks(club) {
  const errors = [];
  (club.contacts || []).forEach((c, i) => {
    const isInvite = c.url && INVITE_RE.test(c.url);
    if (isInvite && c.access !== "invite") {
      errors.push(`/contacts/${i} is a private invite link. Publish it only if the group admins agreed, and then set "access: invite". Otherwise remove the url and set "access: on_request" with a "note" on how to get in.`);
    }
    if (c.access === "on_request" && isInvite) {
      errors.push(`/contacts/${i} has access on_request but still holds an invite link; remove the url.`);
    }
    if (c.access === "on_request" && !c.note) {
      errors.push(`/contacts/${i} has access on_request but no "note" on how to get in.`);
    }
  });
  return errors;
}
