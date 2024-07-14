module.exports = (sequelize, DataTypes) => {
  const AnaerobicExercise = sequelize.define('AnaerobicExercise', {
    exerciseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'ExerciseLists',
        key: 'exerciseId'
      }
    },
    set: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    repetition: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exerciseTime: {
      type: DataTypes.TIME,
      allowNull: false,
    }
  });

  return AnaerobicExercise;
};
