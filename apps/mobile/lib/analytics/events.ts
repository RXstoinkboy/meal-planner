/**
 * CLIENT events — fired at the user action site (button press).
 * Naming: "{slice}.{ui_element}.clicked".
 *
 * No server twin for auth yet: the backend tracks nothing for now (see
 * apps/backend/app/services/events.ts for the server-side template). Add a
 * server event only when you need the authoritative fact — silent re-login,
 * token refresh and session expiry never pass through this file.
 *
 * If an action ever gains a second trigger (deep link, programmatic), promote
 * its name from "{slice}.{element}.clicked" to "{slice}.{action}_started" —
 * element-coupled names lie once the element is no longer the only entry point.
 *
 * Slices can nest; every level exposes `base` and reuses the previous
 * level's base to derive its own:
 *
 *   const authSignup = `${authBase}_signup` as const;
 *   ...
 *   signup: {
 *     base: authSignup,              // "auth_signup"
 *     buttonClicked: `${authSignup}_button_clicked`,
 *   },
 */
const authBase = "auth" as const;

export const events = {
  auth: {
    base: authBase,
    signupButtonClicked: `${authBase}_signup_button_clicked`,
    loginButtonClicked: `${authBase}_login_button_clicked`,
    logoutButtonClicked: `${authBase}_logout_button_clicked`,
  },
} as const;

type EvenValues<T> = {
  [K in keyof T]: K extends "base"
    ? never
    : T[K] extends object
      ? EvenValues<T[K]>
      : T[K];
}[keyof T];

/** Union of all leaf event names (base strings excluded). */
export type Event = Exclude<EvenValues<typeof events>, never>;
