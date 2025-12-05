export default (sequelize, Sequelize) => {
  const AthletePlan = sequelize.define("athletePlan", {
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
    planId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'exercisePlans',
        key: 'id',
      },
    },
    assignedBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Coach who assigned the plan',
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Plan end date',
    },
    status: {
      type: Sequelize.ENUM('active', 'completed', 'paused'),
      allowNull: false,
      defaultValue: 'active',
    },
  });

  AthletePlan.associate = function(models) {
    AthletePlan.belongsTo(models.User, {
      foreignKey: 'athleteId',
      as: 'athlete'
    });
    AthletePlan.belongsTo(models.ExercisePlan, {
      foreignKey: 'planId',
      as: 'plan'
    });
    AthletePlan.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'coach'
    });
  };
  
  return AthletePlan;
};