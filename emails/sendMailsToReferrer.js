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


// const sendNewRefeeeJoinEmail = asyncHandler(async (req, res) => {
//     const { businessId, campaignId, referrerId, refereeId } = req.body;

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const business = await Business.findById(businessId).session(session);
//         const campaign = await Campaign.findById(campaignId).session(session);
//         const referrer = await Referrer.findById(referrerId).session(session);
//         const referee = await Referee.findById(refereeId).session(session);

//         if (!business || !campaign || !referrer || !referee) {
//             throw new Error("Business, Campaign, referrer, or referee not found.");
//         }

//         // Parse the campaign state to get email subject and content
//         let campaignState;
//         try {
//             campaignState = JSON.parse(campaign.emailJSON);
//         } catch (error) {
//             throw new Error("Failed to parse campaign state");
//         }

//         // Get welcome email subject and HTML
//         const welcomeEmail = campaignState.welcome;
//         if (!welcomeEmail || !welcomeEmail.subject || !campaign.emailHtml?.welcome) {
//             throw new Error("No welcome email template found in campaign");
//         }

//         // Replace variables in subject
//         const emailSubject = welcomeEmail.subject
//             .replace(/{{businessName}}/g, business.businessName || business.name);

//         // Replace variables in HTML content
//         const personalizedHtml = campaign.emailHtml.welcome
//             .replace(/{{customerName}}/g, referee.name)
//             .replace(/{{businessName}}/g, business.businessName || business.name)
//             .replace(/{{yourName}}/g, business.name);

//         // Find QR code (keeping your existing logic)
//         const qrCode = business.qrCodes.find(qr => 
//             qr.referrerId?.toString() === referrerId.toString()
//         );

//         if (!qrCode) {
//             throw new Error("QR Code not found for the given referrer.");
//         }

//         const refereeListURL = `${client_url}/referee-list/${referrerId}`;

//         // Send email with the campaign template and subject
//         const sent = await transporter.sendMail({
//             to: referrer.email,
//             subject: emailSubject,
//             html: personalizedHtml,
//             text: `Hello ${referrer.name},\n\n${referee.name} has joined ${campaign.campaignName} through your referral.`
//         });

//         if (sent) {
//             await session.commitTransaction();
//             session.endSession();
//             return true;
//         }

//         throw new Error("Failed to send email.");
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error("Failed to send invitation mail", error);
//         return false;
//     }
// });



// const sendReferrerWelcomeEmail = asyncHandler(async (req, res) => {
//     const { businessId, email, name, campaignId, referrerId } = req.body;

//     const session = await mongoose.startSession(); // Start a session
//     session.startTransaction();

//     try {
//         const business = await Business.findById(businessId).session(session);
//         const campaign = await Campaign.findById(campaignId).session(session);

//         if (!business || !campaign) {
//             throw new Error("Business or Campaign not found.");
//         }

//         // Proper way to find the QR code
//         const qrCode = business.qrCodes.find(qr => qr.referrerId?.toString() === referrerId.toString());

//         if (!qrCode) {
//             throw new Error("QR Code not found for the given referrer.");
//         }

//         const refereeListURL = `${client_url}/referee-list/${referrerId}`;
//         const signupURL = `${client_url}/referrer-setup-pass/${businessId}/${referrerId}/${email}`;

//         const sent = await transporter.sendMail({
//             to: email,
//             subject: `Joined on ${campaign?.campaignName} from ${business?.name}`,
//             html: `<!DOCTYPE html>
//             <html>
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Welcome to ${campaign?.campaignName} Referral Program</title>
//                 <style>
//                     body {
//                         font-family: 'Arial', sans-serif;
//                         background-color: #f8fafc;
//                         margin: 0;
//                         padding: 0;
//                         color: #2d3748;
//                         line-height: 1.6;
//                     }
//                     .container {
//                         max-width: 600px;
//                         margin: 30px auto;
//                         background: #ffffff;
//                         padding: 30px;
//                         border-radius: 8px;
//                         box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
//                         border: 1px solid #e2e8f0;
//                     }
//                     .header {
//                         text-align: center;
//                         padding-bottom: 20px;
//                         border-bottom: 1px solid #edf2f7;
//                     }
//                     .header img {
//                         max-width: 180px;
//                         height: auto;
//                     }
//                     .welcome-box {
//                         background-color: #f0f9ff;
//                         padding: 20px;
//                         border-radius: 8px;
//                         margin: 25px 0;
//                         text-align: center;
//                     }
//                     h1 {
//                         color: #1e40af;
//                         font-size: 24px;
//                         margin-bottom: 15px;
//                         text-align: center;
//                     }
//                     h2 {
//                         color: #1e40af;
//                         font-size: 20px;
//                         margin: 30px 0 15px 0;
//                         border-bottom: 2px solid #dbeafe;
//                         padding-bottom: 8px;
//                     }
//                     p {
//                         font-size: 16px;
//                         margin-bottom: 20px;
//                         color: #4a5568;
//                     }
//                     .action-card {
//                         background: #f8fafc;
//                         border-radius: 8px;
//                         padding: 20px;
//                         margin: 20px 0;
//                         border: 1px solid #e2e8f0;
//                     }
//                     .button {
//                         display: inline-block;
//                         background-color: #2563eb;
//                         color: white !important;
//                         padding: 12px 25px;
//                         text-decoration: none;
//                         border-radius: 6px;
//                         font-weight: 600;
//                         font-size: 16px;
//                         margin: 10px 0;
//                         text-align: center;
//                     }
//                     .qr-code {
//                         max-width: 200px;
//                         margin: 15px auto;
//                         display: block;
//                     }
//                     .steps {
//                         margin-left: 20px;
//                     }
//                     .steps li {
//                         margin-bottom: 10px;
//                     }
//                     .footer {
//                         text-align: center;
//                         margin-top: 40px;
//                         font-size: 13px;
//                         color: #718096;
//                         border-top: 1px solid #e2e8f0;
//                         padding-top: 20px;
//                     }
//                     .highlight {
//                         color: #1e40af;
//                         font-weight: 600;
//                     }
//                     .social-share-container {
//                         display: flex;
//                         justify-content: center;
//                         flex-wrap: wrap;
//                         gap: 15px;
//                         margin-top: 20px;
//                     }
//                     .social-share-item {
//                         text-align: center;
//                         width: 60px;
//                     }
//                     .social-icon {
//                         display: inline-block;
//                         width: 40px;
//                         height: 40px;
//                         background-size: 24px;
//                         background-repeat: no-repeat;
//                         background-position: center;
//                         border-radius: 50%;
//                         transition: transform 0.2s;
//                     }
//                     .social-icon:hover {
//                         transform: scale(1.1);
//                     }
//                     .facebook { background-color: #3b5998; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>'); }
//                     .twitter { background-color: #000000; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>'); }
//                     .whatsapp { background-color: #25D366; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'); }
//                     .linkedin { background-color: #0077B5; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'); }
//                     .email { background-color: #EA4335; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/></svg>'); }
//                     .social-label {
//                         display: block;
//                         margin-top: 5px;
//                         font-size: 12px;
//                         color: #4a5568;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="header">
//                         <img src="https://t3.ftcdn.net/jpg/05/16/27/60/360_F_516276029_aMcP4HU81RVrYX8f5qCAOCCuOiCsu5UF.jpg" alt="${business?.name} Logo">
//                     </div>
                    
//                     <div class="welcome-box">
//                         <h1>Welcome to ${campaign?.campaignName}!</h1>
//                         <p>You've been personally invited by <span class="highlight">${business?.name}</span> to join their referral program.</p>
//                     </div>
                    
//                     <!-- QR Code Sharing Section -->
//                     <h2>Start Earning Rewards</h2>
//                     <div class="action-card">
//                         <p><strong>Your Personal QR Code:</strong> Share this to invite others and earn rewards</p>
//                         <img src="${qrCode?.qrCodeBase64}" class="qr-code" alt="Your Referral QR Code">
                        
//                         <ol class="steps">
//                             <li><span class="highlight">Share</span> this QR code on social media or messaging apps</li>
//                             <li>When someone scans it and joins, they become your referee</li>
//                             <li><span class="highlight">Earn rewards</span> for every new member you bring in!</li>
//                         </ol>
                        
//                         <div class="social-share-container">
//                             <div class="social-share-item">
//                                 <a href="https://www.facebook.com/sharer/sharer.php?u=${refereeListURL}" target="_blank" class="social-icon facebook" title="Share on Facebook">Facebook</a>
//                                 <span class="social-label">Facebook</span>
//                             </div>
//                             <div class="social-share-item">
//                                 <a href="https://twitter.com/intent/tweet?text=Join%20${encodeURIComponent(campaign?.campaignName)}%20with%20my%20referral%20code&url=${refereeListURL}" target="_blank" class="social-icon twitter" title="Share on Twitter">Twitter</a>
//                                 <span class="social-label">Twitter/X</span>
//                             </div>
//                             <div class="social-share-item">
//                                 <a href="https://wa.me/?text=Check%20out%20this%20referral%20program%20from%20${encodeURIComponent(business?.name)}:%20${refereeListURL}" target="_blank" class="social-icon whatsapp" title="Share on WhatsApp">WhatsApp</a>
//                                 <span class="social-label">WhatsApp</span>
//                             </div>
//                             <div class="social-share-item">
//                                 <a href="https://www.linkedin.com/shareArticle?mini=true&url=${refereeListURL}&title=${encodeURIComponent(campaign?.campaignName)}&summary=${encodeURIComponent(business?.name)}%20referral%20program" target="_blank" class="social-icon linkedin" title="Share on LinkedIn">LinkedIn</a>
//                                 <span class="social-label">LinkedIn</span>
//                             </div>
//                             <div class="social-share-item">
//                                 <a href="mailto:?subject=Join%20me%20in%20${encodeURIComponent(campaign?.campaignName)}&body=Hi,%20I%20thought%20you%20might%20be%20interested%20in%20this%20referral%20program:%20${refereeListURL}" class="social-icon email" title="Share via Email">Email</a>
//                                 <span class="social-label">Email</span>
//                             </div>
//                         </div>

//                         <div style="text-align: center;">
//                             <a href="${refereeListURL}" class="button">Track Your Referrals</a>  
//                         </div>
//                     </div>
                    
//                     <!-- Dashboard Signup Section -->
//                     <h2>Access Your Referral Dashboard</h2>
//                     <div class="action-card">
//                         <p>Complete your signup to access your personal dashboard where you can:</p>
//                         <ul class="steps">
//                             <li>Track all your referrals in real-time</li>
//                             <li>Monitor your earned rewards</li>
//                             <li>Get performance insights</li>
//                             <li>Manage your account settings</li>
//                         </ul>
//                         <div style="text-align: center;">
//                             <a href="${signupURL}" class="button">Complete Your Signup</a>
//                         </div>
//                     </div>
                    
//                     <div class="footer">
//                         <p>Need help? Contact our support team at support@${business?.name.toLowerCase().replace(/\s+/g, '')}.com</p>
//                         <p>&copy; ${new Date().getFullYear()} ${business?.name}. All rights reserved.</p>
//                     </div>
//                 </div>
//             </body>
//             </html>`
//         });

//         if (sent) {
//             await session.commitTransaction(); // Commit transaction
//             session.endSession(); // End session after committing
//             // return res.status(200).json({ message: 'Invitation mail sent successfully' });
//             return true;
//         }

//         throw new Error("Failed to send email.");
//     } catch (error) {
//         session.endSession();
//         console.error("Failed to send invitation mail", error);
//         return false
//     }
// });


const sendReferrerWelcomeEmail = asyncHandler(async (req, res) => {
    const { businessId, email, name, campaignId, referrerId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const business = await Business.findById(businessId).session(session);
        const campaign = await Campaign.findById(campaignId).session(session);
        const referrer = await Referrer.findById(referrerId).session(session)

        if (!business || !campaign) {
            throw new Error("Business or Campaign not found.");
        }

        // Parse the campaign state to get email subject and content
        let campaignState;
        try {
            campaignState = JSON.parse(campaign.emailJSON);
        } catch (error) {
            throw new Error("Failed to parse campaign state");
        }

        // Get welcome email subject and HTML
        const welcomeEmail = campaignState.welcome;
        if (!welcomeEmail || !welcomeEmail.subject || !campaign.emailHtml?.welcome) {
            throw new Error("No welcome email template found in campaign");
        }

        // Replace variables in subject
        const emailSubject = welcomeEmail.subject
            .replace(/{{businessName}}/g, business.businessName || business.name);

        // Replace variables in HTML content
        const personalizedHtml = campaign.emailHtml.welcome
            .replace(/{{businessName}}/g, business.businessName)
            .replace(/{yourName}/g, business.name)
            .replace(/{{customerName}}/g, referrer.name);

        // Find QR code (keeping your existing logic)
        const qrCode = business.qrCodes.find(qr => 
            qr.referrerId?.toString() === referrerId.toString()
        );

        if (!qrCode) {
            throw new Error("QR Code not found for the given referrer.");
        }

        const refereeListURL = `${client_url}/referee-list/${referrerId}`;
        const signupURL = `${client_url}/referrer-setup-pass/${businessId}/${referrerId}/${email}`;

        // Send email with the campaign template and subject
        const sent = await transporter.sendMail({
            to: email,
            subject: emailSubject,
            html: personalizedHtml,
            text: `Hello ${name},\n\nYou've been invited to join ${campaign.campaignName} referral program by ${business.name}.`
        });

        if (sent) {
            await session.commitTransaction();
            session.endSession();
            return true;
        }

        throw new Error("Failed to send email.");
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Failed to send invitation mail", error);
        return false;
    }
});


module.exports = {
    sendNewRefeeeJoinEmail,
    sendReferrerWelcomeEmail
}