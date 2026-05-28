import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'medai-academy-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  name: string
  phone: string
  role: 'admin' | 'user'
  mustChangePassword: boolean
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      console.warn('JWT token expired:', err.expiredAt)
    } else {
      console.warn('JWT verification failed:', err?.message || 'unknown error')
    }
    return null
  }
}

// Check if a token is expired on the client side (without verifying signature)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp) {
      return Date.now() >= payload.exp * 1000
    }
    return false
  } catch {
    return true
  }
}

// Default admin credentials - hidden from the app after first login
export const DEFAULT_ADMIN_PHONE = '770000000'
export const DEFAULT_ADMIN_PASSWORD = 'admin123'

export async function ensureDefaultAdmin(db: any) {
  const usersCollection = db.collection('users')
  
  // Check if admin exists
  const existingAdmin = await usersCollection.findOne({ role: 'admin' })
  
  if (!existingAdmin) {
    // Create default admin with mustChangePassword flag
    const hashedPassword = hashPassword(DEFAULT_ADMIN_PASSWORD)
    
    await usersCollection.insertOne({
      name: 'المدير',
      phone: DEFAULT_ADMIN_PHONE,
      password: hashedPassword,
      role: 'admin',
      mustChangePassword: true,
      xp: 0,
      coins: 0,
      level: 1,
      rankTitle: 'مدير النظام',
      rankIcon: '👑',
      streak: 0,
      maxStreak: 0,
      completedCourses: 0,
      totalHours: 0,
      badges: [],
      joinDate: new Date().toISOString().split('T')[0],
      subscription: 'premium',
      medicalSpecialty: 'إدارة',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    console.log('✅ Default admin created with phone: 770000000')
  }
  
  return existingAdmin
}
