import { api } from "@/lib/api/client";

import type { LoginDto, SignupDto, UserDto } from "./dto";

export function signup(input: SignupDto) {
	return api<UserDto>("/api/v1/auth/signup", { method: "POST", body: input });
}

export function login(input: LoginDto) {
	return api<UserDto>("/api/v1/auth/login", { method: "POST", body: input });
}

export function fetchProfile() {
	return api<UserDto>("/api/v1/account/profile");
}
