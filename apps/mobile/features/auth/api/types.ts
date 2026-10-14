/** Shared login/signup form state — structurally satisfies both request DTOs. */
export type AuthForm = {
	email: string;
	fullName: string;
	password: string;
	passwordConfirmation: string;
};
