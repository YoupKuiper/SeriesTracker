import jwt from 'jsonwebtoken';

export const signTokenFor = (emailAddress: string, settings: any) => {
    if(process.env.JWT_SECRET){
        return jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), //expire after 1 week
            data: { emailAddress: emailAddress, settings },
            iat: Math.floor(Date.now() / 1000)
          }, process.env.JWT_SECRET);    
    }
    throw new Error(`Environment variable for JWT secret required`);
}

export const isValid = (token: string): any => {
    if(process.env.JWT_SECRET){
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || '')
        console.log(`Decoded token: ${JSON.stringify(decodedToken)}`)
        return decodedToken;
    }
    throw new Error(`Environment variable for JWT secret required`);
}