module.exports = (sequelize, DataTypes) => {
  const ExerciseList = sequelize.define('ExerciseList', {
    exerciseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    exerciseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    exerciseType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    exerciseImage: {
      type: DataTypes.BLOB,
    },
    exercisePart: {
      type: DataTypes.STRING,
    }
  });

  return ExerciseList;
};
