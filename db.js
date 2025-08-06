// db.js

require('dotenv').config();
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = docClient;
