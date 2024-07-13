module.exports = (sequelize, DataTypes) => {
    const ExerciseLog = sequelize.define('ExerciseLog', {
      exerciseLogId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      exerciseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ExerciseLists', // 이 모델과 연결
          key: 'exerciseId'
        }
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users', // 이 모델과 연결
          key: 'userId'
        }
      },
      exerciseType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      exerciseDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
  
    ExerciseLog.associate = function(models) {
      ExerciseLog.belongsTo(models.ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });
      ExerciseLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };
  
    return ExerciseLog;
  };
  