const nodemailer = require('nodemailer');

const { jwt: { secret }, mailer: { email, email_password, client_url } } = require('../config/env')

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: email,
        pass: email_password,
    },
});

module.exports = {
    transporter
}