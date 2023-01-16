import jwt from "jsonwebtoken";
import Crypto from "crypto";

export const signTokenFor = (emailAddress: string, wantsEmailNotifications: any, wantsMobileNotifications: any) => {
	if (process.env.JWT_SECRET) {
		return jwt.sign(
			{
				data: { emailAddress, wantsEmailNotifications, wantsMobileNotifications },
				iat: Math.floor(Date.now() / 1000),
			},
			process.env.JWT_SECRET
		);
	}
	throw new Error(`Environment variable for JWT secret required`);
};

export const isValid = (token: string): any => {
	if (process.env.JWT_SECRET) {
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "");
		console.log(`Decoded token: ${JSON.stringify(decodedToken)}`);
		return decodedToken;
	}
	throw new Error(`Environment variable for JWT secret required`);
};

export const createRandomString = (): any => {
	const RANDOM_STRING_SIZE = 21;
	return Crypto.randomBytes(RANDOM_STRING_SIZE).toString("hex").slice(0, RANDOM_STRING_SIZE);
};
