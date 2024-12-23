const { app: { environment } } = require('../config/env');

const errorHandler = (err, req, res, next) => {
    console.error(err);
    const statusCode = res.statusCode ? res.statusCode : 500;

    if (err.name = 'ValidationError') {
        return res.status(400).send({
            message: err.message,
            stack: environment === "production" ? null : err.stack,
        });
    }
    res.status(statusCode).json({
        message: err.message,
        stack: environment === "production" ? null : err.stack,
    });
}

module.exports = {errorHandler};