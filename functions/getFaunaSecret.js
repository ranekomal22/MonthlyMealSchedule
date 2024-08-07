const faunadb = require('faunadb');
require('dotenv').config();

exports.handler = async function(event, context) {
  try {
    const secret = process.env.FAUNADB_SECRET;
    console.log("FAUNADB_SECRET from function:", secret); // Log the secret for debugging
    if (!secret) {
      throw new Error("FAUNADB_SECRET is not defined");
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ secret: secret })
    };
  } catch (error) {
    console.error("Error fetching FaunaDB secret:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

