import { Router } from 'express'
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  trackOrder,
} from '../controllers/order.controller'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

router.use(requireAuth)

router.post('/', createOrder)
router.get('/', getUserOrders)
router.get('/:id', getOrderById)
router.get('/:id/tracking', requireAuth, trackOrder)
router.patch('/:id/cancel', cancelOrder)

export default router