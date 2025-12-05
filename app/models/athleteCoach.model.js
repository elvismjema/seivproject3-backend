export default (sequelize, Sequelize) => {
  const AthleteCoach = sequelize.define("athleteCoach", {
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
    coachId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    endDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'NULL = active relationship',
    },
  });
  
  return AthleteCoach;
};