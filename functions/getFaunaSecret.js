const faunadb = require('faunadb');

exports.handler = async function(event, context) {
  const secret = process.env.FAUNADB_SECRET;
  return {
    statusCode: 200,
    body: JSON.stringify({ secret: secret })
  };
};