const asyncHandler = require('express-async-handler');
const Referrer = require('../models/referrerModel')
const Referee = require('../models/refereeModel')
const Campaign = require('../models/campaignModel')
const Business = require('../models/businessModel')
const { mailer: { client_url } } = require('../config/env');
const { transporter } = require('../helpers/nodemailer.helper');
const { sendNewRefeeeJoinEmail } = require('../emails/sendMailsToReferrer');
const { triggerIntegrations } = require('../service/integrationService');
const mongoose = require("mongoose");

const createReferee = asyncHandler(async (req, res) => {
    const { name, email, phone, date, businessId, campaignId, referrerId } = req.body;
    try {
        if (!name || !email || !businessId || !referrerId) {
            res.status(400).json({ message: "Please include all fields" });
            throw new Error("Please include all fields");
        }

        const referrer = await Referrer.findById(referrerId);

        if (!referrer) {
            return res.status(404).json({ message: "Referrer not found" });
        }

        const referee = await Referee.create({
            name,
            email,
            phone,
            date,
            businessId,
            campaignId,
            referrerId,
            referrerName: referrer.name,
            status: 'Pending'
        })

        if (referee) {
            const mailSent = await sendNewRefeeeJoinEmail({
                body: { businessId, campaignId, referrerId, refereeId: referee._id },
            });

            const integrationData = {
                email: email,
                name: name,
                phone: phone,
                date: date,
                created_at: new Date().toISOString()
            };

            const integrationResults = await triggerIntegrations(campaignId, integrationData);

            console.log('Integration results:', integrationResults);

            if (mailSent && integrationResults) {
                res.status(201).json({ message: 'Sent Successfully' })
            }
        }



    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeByReferrerId = asyncHandler(async (req, res) => {
    const { referrerId } = req.body;

    try {
        const referees = await Referee.find({ referrerId: referrerId });

        if (referees) {
            res.status(201).json(referees);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeByBusinessId = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        const referees = await Referee.find({ businessId: businessId });

        if (!referees) {
            return res.status(404).json({ message: "Referrer not found" });
        }

        const detailedReferees = await Promise.all(
            referees.map(async (ref) => {
                const campaign = await Campaign.findById(ref.campaignId);
                const referrer = await Referrer.findById(ref.referrerId);

                return {
                    ...ref.toObject(),
                    campaignName: campaign?.campaignName,
                    campaignStatus: campaign?.active,
                    referrerName: referrer?.name,
                    referrerEmail: referrer?.email,
                    qrCodeId: referrer?.qrCodeId,
                    // Add anything else you need
                };
            })
        );

        res.status(201).json(detailedReferees);


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

const getRefereeList = asyncHandler(async (req, res) => {
    const { refereerId } = req.body;

    try {
        const referees = await Referee.find({ referrerId: refereerId });
        if (referees) {
            res.status(201).json(referees);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const updateRefereeStatus = asyncHandler(async (req, res) => {
    const { refereeId, status } = req.body;

    try {
        const referee = await Referee.findById(refereeId);

        if (!referee) {
            return res.status(404).json({ message: 'Referee not found' });
        }

        referee.status = status;
        await referee.save();

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server error' });
    }
})

const getRefereeWithCampaignDetails = asyncHandler(async (req, res) => {
    const { businessId } = req.body;

    try {
        // Get referees
        const referees = await Referee.find({ businessId, status: 'Active' });

        const detailedReferees = await Promise.all(
            referees.map(async (ref) => {
                const campaign = await Campaign.findById(ref.campaignId);
                const referrer = await Referrer.findById(ref.referrerId);

                return {
                    ...ref.toObject(),
                    campaignName: campaign?.campaignName,
                    campaignStatus: campaign?.active,
                    reward: campaign?.reward,
                    referrerName: referrer?.name,
                    referrerEmail: referrer?.email,
                    qrCodeId: referrer?.qrCodeId,
                    // Add anything else you need
                };
            })
        );

        res.json(detailedReferees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

// const sendRewardEmailToRefereer = asyncHandler(async (req, res) => {
//     const { businessId, campaignId, refereeId, referrerName, referrerEmail, code } = req.body;

//     try {
//         // 1. Validate input
//         if (!campaignId || !refereeId || !referrerEmail || !businessId || !referrerName || !code) {
//             return res.status(400).json({ message: 'Missing required fields' });
//         }

//         // 2. Get campaign details
//         const campaign = await Campaign.findById(campaignId);
//         if (!campaign) {
//             return res.status(404).json({ message: 'Campaign not found' });
//         }

//         // 3. Get business details
//         const business = await Business.findById(businessId);
//         if (!business) {
//             return res.status(404).json({ message: 'Business not found' });
//         }

//         // 4. Get referee details
//         const referee = await Referee.findById(refereeId);
//         if (!referee) {
//             return res.status(404).json({ message: 'Referee not found' });
//         }

//         // 5. Parse emailJSON and replace placeholders
//         let emailJSON;
//         try {
//             emailJSON = typeof campaign.emailJSON === 'string'
//                 ? JSON.parse(campaign.emailJSON)
//                 : campaign.emailJSON;
//         } catch (e) {
//             return res.status(400).json({ message: 'Invalid email template format' });
//         }

//         // Replace placeholders in each section
//         const replacePlaceholders = (content) => {
//             return content
//                 .replace(/{{referrerName}}/g, referrerName)
//                 .replace(/{{businessName}}/g, business.name || '')
//                 .replace(/{{code}}/g, code)
//                 .replace(/WELCOME50/g, code); // Replace default coupon code if exists
//         };

//         Object.keys(emailJSON).forEach(key => {
//             if (emailJSON[key]?.content) {
//                 emailJSON[key].content = replacePlaceholders(emailJSON[key].content);
//             }
//         });

//         // 6. Generate HTML email from emailJSON
//         const generateEmailHTML = (emailJSON) => {
//             return `
//                 <!DOCTYPE html>
//                 <html>
//                 <head>
//                     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                     <style>
//                         body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
//                         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//                         .section { margin-bottom: 20px; }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="container">
//                         ${emailJSON.logo ? `
//                             <div style="${cssObjectToString(emailJSON.logo.styles)}">
//                                 <img src="${emailJSON.logo.content}" alt="Logo" style="max-width: 100%; height: auto;">
//                             </div>
//                         ` : ''}
                        
//                         ${emailJSON.header ? `
//                             <div style="${cssObjectToString(emailJSON.header.styles)}">
//                                 ${emailJSON.header.content}
//                             </div>
//                         ` : ''}
                        
//                         ${emailJSON.description1 ? `
//                             <div style="${cssObjectToString(emailJSON.description1.styles)}">
//                                 ${emailJSON.description1.content}
//                             </div>
//                         ` : ''}
                        
//                         ${emailJSON.couponCode ? `
//                             <div style="${cssObjectToString(emailJSON.couponCode.styles)}">
//                                 ${emailJSON.couponCode.content}
//                             </div>
//                         ` : ''}
                        
//                         ${emailJSON.description2 ? `
//                             <div style="${cssObjectToString(emailJSON.description2.styles)}">
//                                 ${emailJSON.description2.content}
//                             </div>
//                         ` : ''}
//                     </div>
//                 </body>
//                 </html>
//             `;
//         };

//         // Helper function to convert style objects to CSS strings
//         function cssObjectToString(styles) {
//             return Object.entries(styles)
//                 .map(([key, value]) => `${key}: ${value};`)
//                 .join(' ');
//         }

//         const htmlContent = generateEmailHTML(emailJSON);

//         // 7. Send email
//         const mailOptions = {
//             from: `"${business.name}" <${process.env.EMAIL_FROM}>`,
//             to: referrerEmail,
//             subject: 'Your Reward is Ready!', // Or use emailJSON.subject if available
//             html: htmlContent,
//         };

//         const emailResponse = await transporter.sendMail(mailOptions);

//         // 8. Update referee status to Paid
//         referee.status = 'Paid';
//         referee.rewardPaidAt = new Date();
//         referee.rewardDetails = {
//             type: 'COUPON',
//             code: code,
//             sentAt: new Date(),
//             emailId: emailResponse.messageId
//         };
//         await referee.save();

//         // 9. Return success response
//         res.status(200).json({
//             success: true,
//             message: 'Reward processed and email sent successfully',
//             emailId: emailResponse.messageId,
//             refereeStatus: referee.status,
//         });

//     } catch (error) {
//         console.error('Error processing reward:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to process reward',
//             error: error.message
//         });
//     }
// });


// const sendRewardEmailToRefereer = asyncHandler(async (req, res) => {
//     const { businessId, campaignId, refereeId, referrerName, referrerEmail, code } = req.body;

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         // 1. Validate input
//         if (!campaignId || !refereeId || !referrerEmail || !businessId || !referrerName || !code) {
//             throw new Error('Missing required fields');
//         }

//         // 2. Get required documents
//         const [business, campaign, referee] = await Promise.all([
//             Business.findById(businessId).session(session),
//             Campaign.findById(campaignId).session(session),
//             Referee.findById(refereeId).session(session)
//         ]);

//         if (!business) throw new Error('Business not found');
//         if (!campaign) throw new Error('Campaign not found');
//         if (!referee) throw new Error('Referee not found');

//         // 3. Get and validate reward email template
//         if (!campaign.emailHtml?.reward) {
//             throw new Error('No reward email template found in campaign');
//         }

//         // 4. Parse campaign state for subject if available
//         let emailSubject = 'Your Reward is Ready!';
//         try {
//             const campaignState = JSON.parse(campaign.state || '{}');
//             if (campaignState.reward?.subject) {
//                 emailSubject = campaignState.reward.subject;
//             }
//         } catch (e) {
//             console.warn('Failed to parse campaign state for email subject');
//         }

//         // 5. Replace placeholders in HTML and subject
//         const replacePlaceholders = (str) => {
//             return str
//                 .replace(/{{referrerName}}/g, referrerName)
//                 .replace(/{{businessName}}/g, business.businessName || business.name)
//                 .replace(/{{code}}/g, code)
//                 .replace(/WELCOME50/g, code); // Replace default coupon code if exists
//         };

//         const personalizedHtml = replacePlaceholders(campaign.emailHtml.reward);
//         const personalizedSubject = replacePlaceholders(emailSubject);

//         // 6. Send email
//         const mailOptions = {
//             from: `"${business.name}" <${process.env.EMAIL_FROM}>`,
//             to: referrerEmail,
//             subject: personalizedSubject,
//             html: personalizedHtml,
//             text: `${referrerName}, your reward code is: ${code}` // Fallback text version
//         };

//         const emailResponse = await transporter.sendMail(mailOptions);

//         // 7. Update referee status
//         referee.status = 'Paid';
//         referee.rewardPaidAt = new Date();
//         referee.rewardDetails = {
//             type: 'COUPON',
//             code: code,
//             sentAt: new Date(),
//             emailId: emailResponse.messageId
//         };
//         await referee.save({ session });

//         // 8. Commit transaction and return success
//         await session.commitTransaction();
//         session.endSession();

//         res.status(200).json({
//             success: true,
//             message: 'Reward processed and email sent successfully',
//             emailId: emailResponse.messageId,
//             refereeStatus: referee.status,
//         });

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error('Error processing reward:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to process reward',
//             error: error.message
//         });
//     }
// });


const sendRewardEmailToRefereer = asyncHandler(async (req, res) => {
    const { businessId, campaignId, refereeId, referrerName, referrerEmail, code } = req.body;
    let session;

    try {
        // 1. Validate input
        if (!campaignId || !refereeId || !referrerEmail || !businessId || !referrerName || !code) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 2. Start session and transaction
        session = await mongoose.startSession();
        await session.startTransaction();

        // 3. Get required documents
        const [business, campaign, referee] = await Promise.all([
            Business.findById(businessId).session(session),
            Campaign.findById(campaignId).session(session),
            Referee.findById(refereeId).session(session)
        ]);

        if (!business || !campaign || !referee) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                message: !business ? 'Business not found' : 
                        !campaign ? 'Campaign not found' : 'Referee not found' 
            });
        }

        // 4. Get and validate reward email template
        if (!campaign.emailHtml?.reward) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'No reward email template found in campaign' });
        }

        // 5. Parse campaign state for subject if available
        let emailSubject = 'Your Reward is Ready!';
        try {
            const campaignState = JSON.parse(campaign.state || '{}');
            if (campaignState.reward?.subject) {
                emailSubject = campaignState.reward.subject;
            }
        } catch (e) {
            console.warn('Failed to parse campaign state for email subject');
        }

        // 6. Replace placeholders in HTML and subject
        const replacePlaceholders = (str) => {
            return str
                .replace(/{{referrerName}}/g, referrerName)
                .replace(/{{businessName}}/g, business.businessName || business.name)
                .replace(/{{code}}/g, code)
                .replace(/WELCOME50/g, code);
        };

        const personalizedHtml = replacePlaceholders(campaign.emailHtml.reward);
        const personalizedSubject = replacePlaceholders(emailSubject);

        // 7. Send email
        const mailOptions = {
            from: `"${business.name}" <${process.env.EMAIL_FROM}>`,
            to: referrerEmail,
            subject: personalizedSubject,
            html: personalizedHtml,
            text: `${referrerName}, your reward code is: ${code}`
        };

        const emailResponse = await transporter.sendMail(mailOptions);

        // 8. Update referee status within the transaction
        referee.status = 'Paid';
        referee.rewardPaidAt = new Date();
        referee.rewardDetails = {
            type: 'COUPON',
            code: code,
            sentAt: new Date(),
            emailId: emailResponse.messageId
        };
        await referee.save({ session });

        // 9. Commit transaction
        await session.commitTransaction();
        await session.endSession();

        return res.status(200).json({
            success: true,
            message: 'Reward processed and email sent successfully',
            emailId: emailResponse.messageId,
            refereeStatus: referee.status,
        });

    } catch (error) {
        // Handle transaction cleanup if session exists
        if (session) {
            try {
                await session.abortTransaction();
                await session.endSession();
            } catch (txError) {
                console.error('Error cleaning up transaction:', txError);
            }
        }

        console.error('Error processing reward:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process reward',
            error: error.message
        });
    }
});

module.exports = {
    createReferee,
    getRefereeByReferrerId,
    getRefereeByBusinessId,
    getRefereeList,
    updateRefereeStatus,
    getRefereeWithCampaignDetails,
    sendRewardEmailToRefereer
};