const axios = require('axios');

var express = require('express');
var router = express.Router();
const {check, validationResult} = require('express-validator')
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const User = require('../../models/User');
const request = require('request');
const config = require('config');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route POST api/profile
// @desc Create or Update current users profile
// @access Private
router.post('/',[auth,
    [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skills is required').not().isEmpty(),
    ]], async (req,res) => {
    // try {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;
    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(', ').map(skill => skill.trim());
    }
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin= linkedin;
    if(instagram) profileFields.social.instagram = instagram;

    try{
        let profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);
        //Update
        if(profile){
            profile = await Profile.findOneAndUpdate({user: req.user.id},{ $set: profileFields}, {new: true});
            return res.json( profile);
        }
        //Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
// }
});

// @route GET api/profile
// @desc Get all profiles
// @access Public
router.get('/', async (req,res) => {
    try {
        const profile = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route GET api/profile/user/:user_id
// @desc Get profile by user id
// @access Public
router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({user : req.params.user_id}).populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({msg : 'There is no profile for this user'});
        }
        res.json(profile);
    }catch (err) {
        if(err.kind === 'ObjectId'){
            return res.status(400).json({msg : 'Profile not found'})
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route DELETE api/profile
// @desc Delete profile, user & posts
// @access Private

router.delete('/', auth, async (req,res) => {
    try {
        //remove user posts
        await Post.deleteMany({user : req.user.id})
        await Profile.findOneAndRemove({user : req.user.id});
        await User.findOneAndRemove({_id : req.user.id});
        res.json({msg: "User removed"});
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route PUT api/profile/experience
// @desc Add experience to profile
// @access Private
router.put('/experience',[auth,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty(),
    ]], async (req,res) => {
    // try {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    //Build profile object
    const experience = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };
    try{
        let profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);
        //Update
        if(!profile){
            return res.status(400).json({msg : 'There is no profile for this user'});
        }
        profile.experience.unshift(experience);
        await profile.save();
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
// }
});

// @route DELETE api/profile/experience
// @desc Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({user : req.user.id});
        if(!profile){
            return res.status(400).json({msg : 'There is no profile for this user'});
        }

        profile.experience = profile.experience.filter(x => x.id !== req.params.exp_id);
        await profile.save();
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT api/profile/education
// @desc Add education to profile
// @access Private
router.put('/education',[auth,
    [
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    ]], async (req,res) => {
    // try {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    //Build profile object
    const education = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };
    try{
        let profile = await Profile.findOne({user: req.user.id}).populate('user', ['name', 'avatar']);
        //Update
        if(!profile){
            return res.status(400).json({msg : 'There is no profile for this user'});
        }
        profile.education.unshift(education);
        await profile.save();
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
// }
});

// @route DELETE api/profile/education
// @desc Delete experience from profile
// @access Private
router.delete('/education/:edu_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({user : req.user.id});
        if(!profile){
            return res.status(400).json({msg : 'There is no profile for this user'});
        }

        profile.education = profile.education.filter(x => x.id !== req.params.edu_id);
        await profile.save();
        res.json(profile);
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', async (req, res) => {
    try {
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            'user-agent': 'node.js',
            Authorization: `token ${config.get('githubToken')}`
        };

        const gitHubResponse = await axios.get(uri, { headers });
        return res.json(gitHubResponse.data);
    } catch (err) {
        console.error(err.message);
        return res.status(404).json({ msg: 'No Github profile found' });
    }
});

module.exports = router;
