export default (sequelize, Sequelize) => {
  const Exercise = sequelize.define("exercise", {
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
    },
    category: {
      type: Sequelize.ENUM('strength', 'cardio', 'flexibility', 'balance', 'sport-specific'),
      allowNull: false,
    },
    muscleGroups: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of targeted muscle groups',
    },
    equipment: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    isStandard: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'True if admin-created standard exercise',
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  });

  Exercise.associate = function(models) {
    Exercise.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };
  
  return Exercise;
};