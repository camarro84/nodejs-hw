import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import logger from './middleware/logger.js'
import notFoundHandler from './middleware/notFoundHandler.js'
import errorHandler from './middleware/errorHandler.js'
import notesRouter from './routes/notesRoutes.js'
import { connectMongoDB } from './db/connectMongoDB.js'

const { PORT = 3000, MONGO_URL } = process.env
const app = express()

app.use(logger)
app.use(cors())
app.use(express.json())

app.use('/', notesRouter)

app.use(notFoundHandler)
app.use(errorHandler)

connectMongoDB(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  })
