import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      console.log('🔌 Socket connection without token - allowing anonymous access')
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      console.log('🔌 Socket connection with invalid user token')
      return next(new Error('Invalid user'))
    }

    socket.userId = user._id.toString()
    socket.user = user
    console.log(`🔌 Socket authenticated for user: ${user.name} (${user._id})`)
    
    next()
  } catch (error) {
    console.log('🔌 Socket authentication error:', error.message)
    // Allow connection even if auth fails - user can authenticate later
    next()
  }
}