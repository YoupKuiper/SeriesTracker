import jwt from 'jsonwebtoken';

export const signTokenFor = (emailAddress: string) => {
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), //expire after 1 week
        data: { emailAddress: emailAddress },
        iat: Math.floor(Date.now() / 1000)
      }, process.env.JWT_SECRET || '');
}

export const isValid = (token: string): any => {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || '')
    console.log(`Decoded token: ${JSON.stringify(decodedToken)}`)
    return decodedToken;
}