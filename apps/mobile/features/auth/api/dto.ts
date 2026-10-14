/** Mirrors the Nest user mapper. */
export type UserDto = {
	id: number;
	fullName: string | null;
	email: string;
	createdAt: string;
	updatedAt: string;
	initials: string;
};

/** Mirrors signupSchema; password fields are accepted and ignored by the API. */
export type SignupDto = {
	fullName?: string | null;
	email: string;
	password?: string;
	passwordConfirmation?: string;
};

/** Mirrors loginSchema; the password is accepted and ignored. */
export type LoginDto = {
	email: string;
	password?: string;
};
