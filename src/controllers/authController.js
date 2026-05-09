const { hashPassword, verifyPassword } =
require('../utils/password');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload
} = require('../utils/jwt');

const prisma =
require('../config/db');


const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};


const EMAIL_REGEX =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// REGISTER
async function register(
  req,
  res
) {

  try {

    const {
      email,
      password,
      role
    } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required.'
      });
    }


    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid email format.'
      });
    }


    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters.'
      });
    }


    const existingUser =
      await prisma.user.findUnique({
        where: {
          email:
            email.toLowerCase()
        }
      });


    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'Email already registered.'
      });
    }


    const hashedPassword =
      await hashPassword(password);


    const newUser =
      await prisma.user.create({
        data: {
          email:
            email.toLowerCase(),
          password:
            hashedPassword,
          role:
            role || ROLES.USER
        }
      });


    return res.status(201).json({
      success: true,
      message:
        'User registered successfully.',
      user: {
        id:
          newUser.id,
        email:
          newUser.email,
        role:
          newUser.role,
        createdAt:
          newUser.createdAt
      }
    });

  } catch (err) {

    console.error(
      '[REGISTER ERROR]',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        'Registration failed.'
    });
  }
}


// LOGIN
async function login(
  req,
  res
) {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required.'
      });
    }


    const user =
      await prisma.user.findUnique({
        where: {
          email:
            email.toLowerCase()
        }
      });


    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid credentials.'
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
        message:
          'Invalid credentials.'
      });
    }


    // one active session only
    await prisma.refreshToken.deleteMany({
      where: {
        userId:
          user.id
      }
    });


    const payload =
      buildTokenPayload(user);


    const accessToken =
      generateAccessToken(payload);


    const refreshToken =
      generateRefreshToken(payload);


    await prisma.refreshToken.create({
      data: {
        token:
          refreshToken,
        userId:
          user.id
      }
    });


    return res.status(200).json({
      success: true,
      message:
        'Login successful.',
      accessToken,
      refreshToken,
      expiresIn: '15m',
      user: {
        id:
          user.id,
        email:
          user.email,
        role:
          user.role
      }
    });

  } catch (err) {

    console.error(
      '[LOGIN ERROR]',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        'Login failed.'
    });
  }
}


// REFRESH
async function refresh(
  req,
  res
) {

  try {

    const token =
      req.body.refreshToken;


    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          'Refresh token required.'
      });
    }


    const tokenRecord =
      await prisma.refreshToken.findFirst({
        where: {
          token
        }
      });


    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message:
          'Refresh token revoked or invalid.'
      });
    }


    const decoded =
      verifyRefreshToken(token);


    const user =
      await prisma.user.findUnique({
        where: {
          id:
            decoded.sub
        }
      });


    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found.'
      });
    }


    const payload =
      buildTokenPayload(user);


    // rotate token
    await prisma.refreshToken.deleteMany({
      where: {
        token
      }
    });


    const newAccessToken =
      generateAccessToken(payload);


    const newRefreshToken =
      generateRefreshToken(payload);


    await prisma.refreshToken.create({
      data: {
        token:
          newRefreshToken,
        userId:
          user.id
      }
    });


    return res.status(200).json({
      success: true,
      accessToken:
        newAccessToken,
      refreshToken:
        newRefreshToken,
      expiresIn: '15m'
    });

  } catch (err) {

    console.error(
      '[REFRESH ERROR]',
      err
    );

    return res.status(401).json({
      success: false,
      message:
        'Invalid refresh token.'
    });
  }
}


// LOGOUT
async function logout(
  req,
  res
) {

  try {

    const token =
      req.body.refreshToken;


    if (token) {

      await prisma.refreshToken.deleteMany({
        where: {
          token
        }
      });
    }


    return res.status(200).json({
      success: true,
      message:
        'Logged out successfully.'
    });

  } catch (err) {

    console.error(
      '[LOGOUT ERROR]',
      err
    );

    return res.status(500).json({
      success: false
    });
  }
}


// ME
async function me(
  req,
  res
) {

  try {

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            req.user.id
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });


    return res.status(200).json({
      success: true,
      user
    });

  } catch (err) {

    console.error(
      '[ME ERROR]',
      err
    );

    return res.status(500).json({
      success: false
    });
  }
}


module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};