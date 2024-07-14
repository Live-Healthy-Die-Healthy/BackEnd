module.exports = (sequelize, DataTypes) => {
  const AerobicExercise = sequelize.define('AerobicExercise', {
    exerciseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'ExerciseLists',
        key: 'exerciseId'
      }
    },
    distance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    exerciseTime: {
      type: DataTypes.TIME,
      allowNull: false,
    }
  });

  return AerobicExercise;
};



