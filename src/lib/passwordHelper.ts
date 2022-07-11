import bcrypt from 'bcrypt'

export const createPasswordHash = async (plainTextPassword: string) => {
    return await bcrypt.hash(plainTextPassword, 10)
}


export const isCorrectPassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword)
}