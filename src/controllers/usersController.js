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
      success: false,
      message: 'Failed to fetch users.'
    });
  }
}


module.exports = {
  getAllUsers
};