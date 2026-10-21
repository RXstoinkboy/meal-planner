import { api } from "@/lib/api/client";

import type { LoginDto, SessionDto, SignupDto, UserDto } from "./dto";

export function signup(input: SignupDto) {
	return api<SessionDto>("/api/v1/auth/signup", {
		method: "POST",
		body: input,
	});
}

export function login(input: LoginDto) {
	return api<SessionDto>("/api/v1/auth/login", { method: "POST", body: input });
}

export function fetchProfile() {
	return api<UserDto>("/api/v1/account/profile");
}

/** Revokes one device's refresh-token family; unknown tokens are ignored server-side. */
export function logout(refreshToken: string) {
	return api<void>("/api/v1/auth/logout", {
		method: "POST",
		body: { refreshToken },
	});
}
