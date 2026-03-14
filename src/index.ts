import express from 'express'
import cors from 'cors'
import session from 'express-session'
import productRoutes from './routes/product.routes'
import collectionRoutes from './routes/collection.routes'
import authRoutes from './routes/auth.routes'
import cartRoutes from './routes/cart.routes'
import orderRoutes from './routes/order.routes'
import addressRoutes from './routes/address.routes'
import adminRoutes from './admin/routes/admin.routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    'https://flaws-production.up.railway.app',
    'https://flaws-frontend.vercel.app', 
  ],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  },
}))


app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/collections', collectionRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/addresses', addressRoutes)
app.use('/admin', adminRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})