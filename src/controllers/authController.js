import bcrypt from 'bcrypt'
import createHttpError from 'http-errors'
import { User } from '../models/user.js'
import { Session } from '../models/session.js'
import { createSession, setSessionCookies } from '../services/auth.js'

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw createHttpError(400, 'Email in use')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
      email,
      password: hashedPassword
    })
    const newSession = await createSession(newUser._id)
    setSessionCookies(res, newSession)
    res.status(201).json(newUser)
  } catch (e) {
    next(e)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      throw createHttpError(401, 'Invalid credentials')
    }
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw createHttpError(401, 'Invalid credentials')
    }
    await Session.deleteOne({ userId: user._id })
    const newSession = await createSession(user._id)
    setSessionCookies(res, newSession)
    res.status(200).json(user)
  } catch (e) {
    next(e)
  }
}

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies
    const session = await Session.findOne({
      _id: sessionId,
      refreshToken
    })
    if (!session) {
      throw createHttpError(401, 'Session not found')
    }
    const isSessionTokenExpired =
      new Date() > new Date(session.refreshTokenValidUntil)
    if (isSessionTokenExpired) {
      throw createHttpError(401, 'Session token expired')
    }
    await Session.deleteOne({
      _id: sessionId,
      refreshToken
    })
    const newSession = await createSession(session.userId)
    setSessionCookies(res, newSession)
    res.status(200).json({
      message: 'Session refreshed'
    })
  } catch (e) {
    next(e)
  }
}

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies
    if (sessionId) {
      await Session.deleteOne({ _id: sessionId })
    }
    res.clearCookie('sessionId')
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
