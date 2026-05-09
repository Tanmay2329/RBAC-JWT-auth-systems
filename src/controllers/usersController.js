const prisma =
require('../config/db');


async function getAllUsers(
  req,
  res
) {

  try {

    const users =
      await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false
    });
  }
}


async function getUserById(
  req,
  res
) {

  return res.status(200).json({
    success: true,
    message:
      "Coming soon"
  });
}


async function updateUserRole(
  req,
  res
) {

  return res.status(200).json({
    success: true,
    message:
      "Coming soon"
  });
}


async function deleteUser(
  req,
  res
) {

  return res.status(200).json({
    success: true,
    message:
      "Coming soon"
  });
}


async function getReports(
  req,
  res
) {

  return res.status(200).json({
    success: true,
    reports: []
  });
}


async function createReport(
  req,
  res
) {

  return res.status(201).json({
    success: true
  });
}


async function getSettings(
  req,
  res
) {

  return res.status(200).json({
    success: true
  });
}


module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getReports,
  createReport,
  getSettings
};

