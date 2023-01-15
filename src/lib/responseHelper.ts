export const sendOKResponse = (responseBody: any) => {
	const returnObject = {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
		},
		body: JSON.stringify(responseBody),
	};
	console.log(`Returning: ${JSON.stringify(returnObject)}`);
	return returnObject;
};

export const sendErrorResponse = (responseBody: any) => {
	const returnObject = {
		statusCode: 500,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
		},
		body: JSON.stringify(responseBody),
	};
	console.log(`Returning: ${JSON.stringify(returnObject)}`);
	return returnObject;
};

export const sendVerifyEmailFirstResponse = () => {
	const returnObject = {
		statusCode: 500,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
		},
		body: JSON.stringify({ message: "Please verify your account before logging in" }),
	};
	console.log(`Returning: ${JSON.stringify(returnObject)}`);
	return returnObject;
};

export const sendTokenErrorResponse = (responseBody: any) => {
	const returnObject = {
		statusCode: 400,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,POST,GET",
		},
		body: JSON.stringify(responseBody),
	};
	console.log(`Returning: ${JSON.stringify(returnObject)}`);
	return returnObject;
};
