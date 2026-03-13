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
    'http://localhost:5173',
    'https://flaws-frontend.vercel.app/', 
  ],
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/collections', collectionRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/addresses', addressRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})