const Business = require('../models/businessModel')
const Referrer = require('../models/referrerModel')
const Referee = require('../models/refereeModel')
const Campaign = require('../models/campaignModel')
const asyncHandler = require('express-async-handler');
const mongoose = require("mongoose");
const { mailer: { client_url } } = require('../config/env');
const { transporter } = require('../helpers/nodemailer.helper');


const sendNewRefeeeJoinEmail = asyncHandler(async (req, res) => {
    const { businessId, campaignId, referrerId, refereeId } = req.body;

    const session = await mongoose.startSession(); // Start a session
    session.startTransaction();

    try {
        const business = await Business.findById(businessId).session(session);
        const campaign = await Campaign.findById(campaignId).session(session);
        const refereer = await Referrer.findById(referrerId).session(session);
        const referee = await Referee.findById(refereeId).session(session);

        if (!business || !campaign || !refereer || !referee) {
            throw new Error("Business or Campaign, refereer, refee not found.");
        }

        // Proper way to find the QR code
        const qrCode = business.qrCodes.find(qr => qr.referrerId?.toString() === referrerId.toString());

        if (!qrCode) {
            throw new Error("QR Code not found for the given referrer.");
        }

        const refereeListURL = `${client_url}/referee-list/${referrerId}`;

        const sent = await transporter.sendMail({
            to: refereer.email,
            subject: `New Referee Joined on ${campaign?.campaignName} under ${business?.name}`,
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Referee Joined Through Your Referral</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            padding: 20px;
            border: 1px solid #dddddd;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .header img {
            max-width: 150px;
        }
        .content {
            margin: 20px 0;
            line-height: 1.6;
        }
        .content h1 {
            color: #444;
            font-size: 24px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #666;
        }
        .highlight {
            background-color: #f0f7ff;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button-container {
            text-align: center;
            margin: 25px 0;
        }
        .button {
            background-color: #007BFF;
            color: white !important;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            display: inline-block;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .qr-section img {
            max-width: 200px;
            margin: 15px auto;
            display: block;
        }
        .social-share {
            margin-top: 30px;
            text-align: center;
        }
        .social-share p {
            font-weight: bold;
            margin-bottom: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://t3.ftcdn.net/jpg/05/16/27/60/360_F_516276029_aMcP4HU81RVrYX8f5qCAOCCuOiCsu5UF.jpg" alt="Company Logo">
        </div>
        
        <div class="content">
            <h1>🎉 New Referee Joined Through Your Referral!</h1>
            
            <p>Hello ${refereer.name},</p>
            
            <p>We're excited to let you know that ${referee?.name} has joined the <strong>${campaign?.name}</strong> campaign for <strong>${business?.name}</strong> using your referral link!</p>
            
            <div class="highlight">
                <p><strong>Your referral network is growing!</strong> Keep sharing your unique link and QR code to earn more rewards.</p>
            </div>
            
            <div class="button-container">
                <a href="${refereeListURL}" class="button">Track Your Referrals</a>
            </div>
            
            <div class="qr-section">
                <h3>Your Unique QR Code</h3>
                <p>Share this QR code to bring more people to the campaign:</p>
                <img src="${qrCode?.qrCodeBase64}" alt="Your Unique QR Code" />
                <p>Scan this code to join ${campaign?.name}</p>
            </div>
            
            <div class="social-share">
                <p>Share your QR code on social media:</p>
                <p>
                    <a href="#" style="margin: 0 10px; color: #3b5998;">Facebook</a> | 
                    <a href="#" style="margin: 0 10px; color: #1da1f2;">Twitter</a> | 
                    <a href="#" style="margin: 0 10px; color: #0077b5;">LinkedIn</a> | 
                    <a href="#" style="margin: 0 10px; color: #e1306c;">Instagram</a>
                </p>
            </div>
            
            <p>Thank you for being a valuable part of our referral program. Every new referral brings you closer to exciting rewards!</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The ${business?.name} Team</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${business?.name}. All rights reserved.</p>
            <p><a href="#" style="color: #999;">Privacy Policy</a> | <a href="#" style="color: #999;">Terms of Service</a></p>
        </div>
    </div>
</body>
</html>`
        });

        if (sent) {
            await session.commitTransaction(); // Commit transaction
            session.endSession(); // End session after committing
            // return res.status(200).json({ message: 'Invitation mail sent successfully' });
            return true;
        }

        throw new Error("Failed to send email.");
    } catch (error) {
        session.endSession();
        console.error("Failed to send invitation mail", error);
        return false
    }
});


module.exports = {
    sendNewRefeeeJoinEmail
}