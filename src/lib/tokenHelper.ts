import jwt from 'jsonwebtoken';

export const signTokenFor = (emailAddress: string) => {
    return jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60), //expire after 1 hour
        data: { emailAddress: emailAddress }
      }, process.env.JWT_SECRET || '');
}

export const isValid = (token: string) => {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || '')
    console.log(`Decoded token: ${JSON.stringify(decodedToken)}`)
    return decodedToken;
}