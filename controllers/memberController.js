const asyncHandler = require('express-async-handler');
const Member = require('../models/memberModel');

const getMembersByBusinessId = asyncHandler( async(req, res) => {
    const { businessId } = req.body;

    try {
        const members = await Member.find({businessId: businessId});
        
        if(members){
            res.status(201).json(members);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

module.exports = {
    getMembersByBusinessId
};