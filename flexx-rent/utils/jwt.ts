import { SignJWT, jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET не задан!');
  return new TextEncoder().encode(secret);
};

const getExpiresIn = (): number => {
  return Number(process.env.JWT_EXPIRES_IN) || 7200; 
};

export interface UserJwtPayload {
  userId: number;
  email: string;
  role: string;
}

export async function generateToken(payload: UserJwtPayload): Promise<string> {
  const secret = getSecretKey();
  const expiresInSeconds = getExpiresIn();

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`) 
    .sign(secret);
}

export async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserJwtPayload;
  } catch (error) {
    return null;
  }
}