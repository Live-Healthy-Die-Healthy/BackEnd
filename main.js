require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, User } = require('./src/index');
const routes = require('./src/routes/routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/', routes);

const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  await User.bulkCreate([
    { 
      userId: 'test1',
      username: 'testuser1',
      connectedAt: new Date(),
      password: 'password1',
      userEmail: 'testuser1@example.com',
      userBirth: new Date('1990-01-01'),
      userHeight: 170,
      userWeight: 70,
      userGender: 'male',
      userImage: null // 필요한 경우 이미지를 추가할 수 있습니다.
    }
  ]);
  console.log('test data uploaded');
};



initializeApp();