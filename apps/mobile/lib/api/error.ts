/**
 * Backend failures are stock Nest bodies; validation rides in `message` as
 * [{ field, message }] objects so forms can map inline errors.
 */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly body: unknown,
	) {
		super(messageOf(body, status));
		this.name = "ApiError";
	}
}

function messageOf(body: unknown, status: number) {
	const message = (body as { message?: unknown } | null)?.message;

	if (typeof message === "string") return message;
	if (Array.isArray(message)) {
		const first = message[0];
		if (typeof first === "string") return first;
		if (first && typeof first === "object" && "message" in first) {
			return String((first as { message: unknown }).message);
		}
	}

	return `Request failed (${status})`;
}

export function fieldErrors(error: unknown): Record<string, string> {
	if (!(error instanceof ApiError)) return {};
	const message = (error.body as { message?: unknown } | null)?.message;
	if (!Array.isArray(message)) return {};

	return Object.fromEntries(
		message.flatMap((entry) => {
			const isFieldEntry =
				entry && typeof entry === "object" && "field" in entry;
			if (!isFieldEntry) return [];

			const field = (entry as { field?: unknown }).field;
			const text = (entry as { message?: unknown }).message;

			return field && typeof field === "string"
				? [[field, String(text ?? "")] as const]
				: [];
		}),
	);
}
