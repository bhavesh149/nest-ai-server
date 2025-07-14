// Lambda handler entrypoint
// This file exports the handler from the compiled lambda.js

const { handler } = require('./dist/src/lambda');

// Export the handler for AWS Lambda
exports.handler = handler;
