const {check, validationResult} =require("express-validator");

var express = require('express');
var router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require("jsonwebtoken");
const config = require('config');
const jwtSecret = config.get('jwtSecret');
const User = require('../../models/User');
const bycrpt = require('bcryptjs');

// @route GET api/auth
// @desc get user
// @access Public
router.get('/',auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch (err) {
        res.status(500).send('Server error')
    }
});

// @route Post api/auth/login
// @desc Authenticate user and get token
// @access Public
router.post('/login', [
        check('email','Please include valid mail').isEmail(),
        check('password','Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        try{
            const {email, password} = req.body;
            const user = await User.findOne({email});
            if(!user) {
               return res.status(400).json({errors: [{msg: 'One of the details incorrect'}]});
            }
            const isMatch = await bycrpt.compare(password,user.password)
            if(!isMatch){
                res.status(400).json({errors: [{msg: 'One of the details incorrect'}]});
            }
            const payload = {
                user:{
                    id: user.id
                }
            };
            jwt.sign(payload, jwtSecret,{expiresIn: '30d'},
                (err,token)=> {
                    if(err) throw err;
                    res.json({token})
                })

        }
        catch(err){
            console.error(err.message);
            res.status(500).send('Server error')
        }
    });


module.exports = router;
