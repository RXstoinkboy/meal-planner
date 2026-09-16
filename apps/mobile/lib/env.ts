import { z } from "zod";

const schema = z.object({
	EXPO_PUBLIC_API_URL: z.url(),
});

// ponytail: parse at import = throw at boot, not in runtime.
export const env = schema.parse({
	EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
