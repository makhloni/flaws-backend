import express from 'express'
import cors from 'cors'
import session from 'express-session'
import productRoutes from './routes/product.routes'
import collectionRoutes from './routes/collection.routes'
import authRoutes from './routes/auth.routes'
import cartRoutes from './routes/cart.routes'
import orderRoutes from './routes/order.routes'
import addressRoutes from './routes/address.routes'
import paymentRoutes from './routes/payment.routes'
import adminRoutes from './admin/routes/admin.routes'
import contactRoutes from './routes/contact.routes'
import contentRoutes from './routes/content.routes'
import waitlistRoutes from './routes/waitlist.routes'
import { runAbandonedCartJob } from './jobs/abandonedCart'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 5000


// Run every hour
setTimeout(() => {
  runAbandonedCartJob().catch(console.error)

  setInterval(() => {
    runAbandonedCartJob().catch(console.error)
  }, 1000 * 60 * 60)
}, 1000 * 60 * 2)


app.use(cors({
  origin: [
    'https://www.flawswrldwide.com',
    'http://localhost:5173', 
  ],
  credentials: true,
}))

app.use('/payment/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('trust proxy', 1)

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  },
}))



app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/collections', collectionRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/addresses', addressRoutes)
app.use('/payment', paymentRoutes)
app.use('/admin', adminRoutes)
app.use('/content', contentRoutes)
app.use('/contact', contactRoutes)
app.use('/waitlist', waitlistRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})