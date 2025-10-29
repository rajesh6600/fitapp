import { type NextApiRequest, type NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Validate input
    const result = registerSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: result.error.issues,
      })
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      message: 'User created successfully',
      user,
    })
  } catch (error: any) {
    console.error('Registration error:', error.message, error.stack)
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
  
} 