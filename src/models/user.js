module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userHeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userWeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userGender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userImage: {
      type: DataTypes.BLOB,
    },
    connectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  return User;
};
