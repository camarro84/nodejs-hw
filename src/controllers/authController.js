import bcrypt from 'bcrypt'
import createHttpError from 'http-errors'
import jwt from 'jsonwebtoken'
import fs from 'node:fs/promises'
import path from 'node:path'
import handlebars from 'handlebars'
import { User } from '../models/user.js'
import { Session } from '../models/session.js'
import { createSession, setSessionCookies } from '../services/auth.js'
import { sendEmail } from '../utils/sendMail.js'

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
  } catch (error) {
    next(error)
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
  } catch (error) {
    next(error)
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
  } catch (error) {
    next(error)
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
  } catch (error) {
    next(error)
  }
}

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      res
        .status(200)
        .json({ message: 'Password reset email sent successfully' })
      return
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m'
    })

    const link = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'reset-password-email.html'
    )

    const templateSource = await fs.readFile(templatePath, 'utf-8')
    const template = handlebars.compile(templateSource)

    const html = template({
      name: user.username || user.email,
      link
    })

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset',
        html
      })
    } catch {
      next(
        createHttpError(
          500,
          'Failed to send the email, please try again later.'
        )
      )
      return
    }

    res.status(200).json({
      message: 'Password reset email sent successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      next(createHttpError(401, 'Invalid or expired token'))
      return
    }

    const user = await User.findOne({
      _id: payload.sub,
      email: payload.email
    })

    if (!user) {
      next(createHttpError(404, 'User not found'))
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    await user.save()

    await Session.deleteMany({ userId: user._id })

    res.status(200).json({
      message: 'Password reset successfully'
    })
  } catch (error) {
    next(error)
  }
}
