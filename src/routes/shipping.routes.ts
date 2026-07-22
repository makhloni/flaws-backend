import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware'
import { getRates } from '../controllers/shipping.controller'

const router = Router()
router.post('/rates', requireAuth, getRates)

export default router