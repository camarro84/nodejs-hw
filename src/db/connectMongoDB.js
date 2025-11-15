import mongoose from 'mongoose'
import { Note } from '../models/note.js'

export const connectMongoDB = async () => {
  const { MONGO_URL } = process.env

  if (!MONGO_URL) {
    console.error('MONGO_URL is not defined')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URL)
    await Note.syncIndexes()
    console.log('✅ MongoDB connection established successfully')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}
