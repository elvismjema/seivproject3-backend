export default (sequelize, Sequelize) => {
  const Goal = sequelize.define("goal", {
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
    targetValue: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Target numeric value',
    },
    targetUnit: {
      type: Sequelize.ENUM('reps', 'weight_lbs', 'weight_kg', 'time_seconds', 'distance_meters'),
      allowNull: false,
    },
    targetDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: 'Target completion date',
    },
    status: {
      type: Sequelize.ENUM('active', 'completed', 'cancelled', 'incomplete'),
      allowNull: false,
      defaultValue: 'active',
    },
    completedDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Date when goal was completed',
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Who created the goal (coach or athlete)',
    },
  });

  Goal.associate = function(models) {
    Goal.belongsTo(models.User, {
      foreignKey: 'athleteId',
      as: 'athlete'
    });
    Goal.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    Goal.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId',
      as: 'exercise'
    });
  };
  
  return Goal;
};