const jwt = require('jsonwebtoken');
const { jwt: { secret } } = require('../config/env')
const asyncHandler = require("express-async-handler");


const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not authorized");
        }
    }
    if (!token) {
        res.status(401);
        throw new Error("Not authorized");
    }
})

module.exports = { authMiddleware };