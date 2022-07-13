export const sendOKResponse = (responseBody: any) => {
    return {
        statusCode: 200,
        body: JSON.stringify(responseBody)
      }
}

export const sendErrorResponse = (responseBody: any) => {
    return {
        statusCode: 400,
        body: JSON.stringify(responseBody)
      }
}

