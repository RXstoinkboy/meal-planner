/** Mirrors the Nest user mapper. */
export type UserDto = {
	id: number;
	fullName: string | null;
	email: string;
	createdAt: string;
	updatedAt: string;
	initials: string;
};

/** Mirrors session.mapper's sessionResponseSchema: signup and login return both tokens. */
export type SessionDto = {
	accessToken: string;
	refreshToken: string;
	user: UserDto;
};

/** Mirrors signupSchema: password required, confirmation must match. */
export type SignupDto = {
	fullName?: string | null;
	email: string;
	password: string;
	passwordConfirmation: string;
};

/** Mirrors loginSchema. */
export type LoginDto = {
	email: string;
	password: string;
};
