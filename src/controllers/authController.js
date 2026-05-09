const { hashPassword, verifyPassword } = require('../utils/password');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload,
} = require('../utils/jwt');

const prisma = require('../config/db');

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};


// REGISTER
async function register(req, res) {
  try {

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: email.toLowerCase()
        }
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const hashedPassword =
      await hashPassword(password);

    const assignedRole =
      role || ROLES.USER;

    const newUser =
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          role: assignedRole
        }
      });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Registration failed.'
    });
  }
}


// LOGIN
async function login(req, res) {

  try {

    const { email, password } = req.body;

    const user =
      await prisma.user.findUnique({
        where: {
          email: email.toLowerCase()
        }
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const valid =
      await verifyPassword(
        password,
        user.password
      );

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const payload =
      buildTokenPayload(user);

    const accessToken =
      generateAccessToken(payload);

    const refreshToken =
      generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Login failed.'
    });
  }
}


module.exports = {
  register,
  login
};