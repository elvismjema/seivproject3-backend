export default (sequelize, Sequelize) => {
  const ExercisePlan = sequelize.define("exercisePlan", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Plan description and goals',
    },
    duration: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Duration in weeks',
    },
    isStandard: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'True if admin-created',
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    dayCheck: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Bitmask for selected workout days',
    },
    dayOpness: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Bitmask for day openness',
    },
  });

  ExercisePlan.associate = function(models) {
    ExercisePlan.hasMany(models.PlanExercise, {
      foreignKey: 'planId',
      as: 'planExercises'
    });
    ExercisePlan.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };
  
  return ExercisePlan;
};