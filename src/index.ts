import express from 'express'
import cors from 'cors'
import productRoutes from './routes/product.routes'
import collectionRoutes from './routes/collection.routes'
import authRoutes from './routes/auth.routes'
import cartRoutes from './routes/cart.routes'
import orderRoutes from './routes/order.routes'
import addressRoutes from './routes/address.routes'
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

app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/collections', collectionRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/addresses', addressRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})