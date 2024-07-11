require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, Test } = require('./src/index');

const app = express();
const port = process.env.PORT || 3000;


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

  await Test.bulkCreate([
    { username: 'test1', 
    password: '1234',
   }
  ]);
  console.log('test data uploaded');
};



initializeApp();

app.get('/', (req, res) => {
  res.send('Hello');
});