import { Router } from 'express'
import multer from 'multer'
import { requireAdminAuth } from '../middleware/adminAuth'
import { getLogin, postLogin, postLogout } from '../controllers/auth.admin'
import { getDashboard } from '../controllers/dashboard.admin'
import { getProducts, getNewProduct, postProduct, getEditProduct, postEditProduct, deleteProduct, deleteProductImage } from '../controllers/products.admin'
import { getCollections, getNewCollection, postCollection, getEditCollection, postEditCollection, deleteCollection } from '../controllers/collections.admin'
import { getOrders, getOrder, updateOrderStatus } from '../controllers/orders.admin'
import { getUsers } from '../controllers/users.admin'
import { getActivityLog } from '../controllers/activity.admin'
import { getHomepage, postHomepage } from '../controllers/homepage.admin'
import { adminExportWaitlistCSV, adminGetWaitlist, adminToggleWaitlistMode } from '../controllers/waitlist.admin'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Auth
router.get('/login', getLogin)
router.post('/login', postLogin)
router.post('/logout', postLogout)

// Protected routes
router.use(requireAdminAuth)

// Dashboard
router.get('/', getDashboard)

// Products
router.get('/products', getProducts)
router.get('/products/new', getNewProduct)
router.post('/products', upload.array('images', 5), postProduct)
router.get('/products/:id/edit', getEditProduct)
router.post('/products/:id/edit', upload.array('images', 5), postEditProduct)
router.post('/products/:id/delete', deleteProduct)
router.post('/products/:id/images/:imageId/delete', deleteProductImage)

// Collections
router.get('/collections', getCollections)
router.get('/collections/new', getNewCollection)
router.post('/collections', postCollection)
router.get('/collections/:id/edit', getEditCollection)
router.post('/collections/:id/edit', postEditCollection)
router.post('/collections/:id/delete', deleteCollection)

// Orders
router.get('/orders', getOrders)
router.get('/orders/:id', getOrder)
router.post('/orders/:id/status', updateOrderStatus)

// Users
router.get('/users', getUsers)

router.get('/activity', getActivityLog)
router.get('/homepage', getHomepage)
router.post('/homepage', postHomepage)

router.get('/waitlist', adminGetWaitlist)
router.post('/waitlist/toggle', adminToggleWaitlistMode)
router.get('/waitlist/export', adminExportWaitlistCSV)

export default router