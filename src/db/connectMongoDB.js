import mongoose from 'mongoose'

export async function connectMongoDB(uri) {
  await mongoose.connect(uri)
  console.log('✅ MongoDB connection established successfully')
}
