import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import prisma from '../lib/prisma'

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - no token provided' })
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ message: 'Unauthorized - invalid token' })
  }

  // Supabase confirming the token is valid doesn't mean a matching
  // row exists in our own User table — check separately.
  const user = await prisma.user.findUnique({ where: { id: data.user.id } })
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized - user record not found' })
  }

  req.user = user
  next()
}