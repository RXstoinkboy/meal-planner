import * as Sentry from "@sentry/react-native";

/**
 * Sentry facade — the only module importing the SDK. Swap providers by
 * rewriting this file; no call sites change.
 */

// Public-safe client key for the mobile project, safe in the app bundle.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Status code of a *failed request* event, whichever shape the SDK used. */
function responseStatus(event: Sentry.Event): number {
  const response = event.contexts?.response as
    { status_code?: number } | undefined;
  const statusCodeFromTag = Number(event.tags?.["http.status_code"]) ?? 0;
  const statusCodeFromContext = Number(response?.status_code ?? 0);

  return statusCodeFromTag || statusCodeFromContext;
}

Sentry.init({
  dsn,
  // ponytail: no-op without a DSN — local dev and tests stay clean.
  enabled: Boolean(dsn),
  environment: __DEV__ ? "development" : "production",
  // phase 1 = errors only; tracing and replay stay off to protect the quota
  tracesSampleRate: 0,
  enableCaptureFailedRequests: true,
  maxBreadcrumbs: 30,
  sendDefaultPii: false,
  beforeSend(event) {
    const status = responseStatus(event);
    // 4xx = bad input or expired token, not a bug
    if (status && status < 500) {
      return null;
    }
    // never email/username/ip
    if (event.user) {
      event.user = { id: event.user.id };
    }
    // headers carry Authorization, body carries meal/health data
    // pi-lens-ignore: ast-grep:ts-delete-property
    delete event.request;
    // pi-lens-ignore: ast-grep:ts-delete-property
    delete event.extra;
    return event;
  },
  ignoreErrors: [/AbortError/, /cancelled/i],
});

/** Call on login/hydrate, and with `null` on logout. */
export const setSentryUser = (id: string | null) => {
  const LOGOUT_VALUE = null;

  return Sentry.setUser(id ? { id } : LOGOUT_VALUE);
};

/** Error-boundary/HOC wrapper for the root layout — keeps the SDK import here. */
export const wrapWithSentry = Sentry.wrap;
