const { hashPassword, verifyPassword } = require('../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload,
} = require('../utils/jwt');

const prisma = require('../config/db');
const { ROLES } = require('../models/store');


/**
 * POST /auth/register
 */
async function register(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Check duplicate
    const existingUser = await prisma.user.findUnique({
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

    const validRoles = Object.values(ROLES);

    const assignedRole =
      role && validRoles.includes(role)
        ? role
        : ROLES.USER;

    const hashedPassword =
      await hashPassword(password);

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
        createdAt: newUser.createdAt,
      },
    });

  } catch (err) {
    console.error('[register]', err);

    return res.status(500).json({
      success: false,
      message: 'Registration failed.'
    });
  }
}


/**
 * POST /auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

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

    const passwordValid =
      await verifyPassword(
        password,
        user.password
      );

    if (!passwordValid) {
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

    res.cookie(
      'refreshToken',
      refreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:
          7 * 24 * 60 * 60 * 1000
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      expiresIn: '15m',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('[login]', err);

    return res.status(500).json({
      success: false,
      message: 'Login failed.'
    });
  }
}


/**
 * POST /auth/refresh
 */
async function refresh(req, res) {
  try {
    const token =
      req.body.refreshToken ||
      req.cookies?.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required.'
      });
    }

    const storedToken =
      await prisma.refreshToken.findFirst({
        where: {
          token
        }
      });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token revoked or invalid.'
      });
    }

    const decoded =
      verifyRefreshToken(token);

    const user =
      await prisma.user.findUnique({
        where: {
          id: decoded.sub
        }
      });

    if (!user) {
      await prisma.refreshToken.deleteMany({
        where: {
          token
        }
      });

      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    const payload =
      buildTokenPayload(user);

    const newAccessToken =
      generateAccessToken(payload);

    // Token rotation
    await prisma.refreshToken.deleteMany({
      where: {
        token
      }
    });

    const newRefreshToken =
      generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id
      }
    });

    res.cookie(
      'refreshToken',
      newRefreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:
          7 * 24 * 60 * 60 * 1000
      }
    );

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m'
    });

  } catch (err) {

    if (
      err.name ===
      'TokenExpiredError'
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Refresh token expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token.'
    });
  }
}


/**
 * POST /auth/logout
 */
async function logout(req, res) {
  try {
    const token =
      req.body.refreshToken ||
      req.cookies?.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({
        where: {
          token
        }
      });
    }

    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: 'Logout failed.'
    });
  }
}


/**
 * GET /auth/me
 */
async function me(req, res) {

  const user =
    await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions:
        req.user.permissions,
      createdAt:
        user.createdAt
    }
  });
}


module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};