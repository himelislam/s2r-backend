module.exports = {
    app: {
        port: process.env.PORT,
        environment: process.env.NODE_ENV,
        cors_origin: process.env.CORS_ORIGIN,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    mongo: {
        user: process.env.MONGO_USER || "user",
        password: process.env.MONGO_PASSWORD || "password",
        uri: process.env.MONGO_URI ||
            `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@s2r-cluster01.qj1lz.mongodb.net/?retryWrites=true&w=majority&appName=S2R-Cluster01`
    },
};