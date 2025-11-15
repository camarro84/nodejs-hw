import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { errors } from 'celebrate'

import { logger } from './middleware/logger.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import notesRouter from './routes/notesRoutes.js'
import { connectMongoDB } from './db/connectMongoDB.js'

const { PORT = 3000 } = process.env

const app = express()

app.use(logger)
app.use(cors())
app.use(express.json())

app.use('/', notesRouter)

app.use(notFoundHandler)
app.use(errors())
app.use(errorHandler)

const start = async () => {
  await connectMongoDB()
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
  })
}

start()
