export default (sequelize, Sequelize) => {
  const ExerciseResult = sequelize.define("exerciseResult", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    athleteId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    exerciseId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'exercises',
        key: 'id',
      },
    },
    performedDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    sets: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Number of sets completed',
    },
    reps: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Total reps completed',
    },
    weight: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Weight used (lbs/kg)',
    },
    duration: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds',
    },
    distance: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Distance in meters',
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Performance notes',
    },
  });

  ExerciseResult.associate = function(models) {
    ExerciseResult.belongsTo(models.User, {
      foreignKey: 'athleteId',
      as: 'athlete'
    });
    ExerciseResult.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId',
      as: 'exercise'
    });
  };
  
  return ExerciseResult;
};