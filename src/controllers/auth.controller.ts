import { Request, Response } from 'express'
import { supabase, supabaseAdmin } from '../lib/supabase'
import prisma from '../lib/prisma'

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password and name are required' })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return res.status(400).json({ message: error.message })

  const user = await prisma.user.create({
    data: {
      id: data.user.id,
      email,
      name,
      phone,
    },
  })

  res.status(201).json({ message: 'Account created', user })
}

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(401).json({ message: error.message })

  res.json({
    token: data.session.access_token,
    user: data.user,
  })
}

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (token) await supabaseAdmin.auth.admin.signOut(token)

  res.json({ message: 'Logged out' })
}

// GET /api/auth/me
export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { addresses: true },
  })
  res.json(user)
}