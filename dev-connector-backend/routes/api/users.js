var express = require('express');
var router = express.Router();
const {check, validationResult} = require('express-validator')
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const config = require('config');
const jwtSecret = config.get('jwtSecret');

// @route Post api/register
// @desc
// @access Public
router.post('/', [
      check('name','Name is required').not().isEmpty(),
      check('email','Please include valid mail').isEmail(),
      check('password','Please enter a password with 6 or more character').isLength({ min: 6}),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
      }

      try{
        //check if user already exists
        const {name, email, password} = req.body;
        const userExists = await User.findOne({email});
        if(userExists) {
         return res.status(400).json({errors: [{msg: 'User already exists'}]});
        }

        const avatar = gravatar.url(email,{s:'200', r:'pg', d:'mm'});

        let user = await User.create({name, email, avatar, password});
        const salt = await bcrypt.genSaltSync(10);
        user.password = await bcrypt.hashSync(password, salt);
        await user.save();

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
