import bcrypt from 'bcrypt'

export const createPasswordHash = async (plainTextPassword: string) => {
    return await bcrypt.hash(plainTextPassword, 10)
}