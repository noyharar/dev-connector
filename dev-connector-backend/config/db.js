const mongoose = require("mongoose");
const config = require('config');
const db = config.get('mongoURI');


const connectDB = async () => {
    try{
        var finalUri = db;
        mongoose.set('strictQuery', false);
       await mongoose.connect(finalUri)
        console.log(`MongoDB connected..`)
    }catch(error){
        console.error(`Error: ${error.message}`);
        process.exit(1)
    }
};
module.exports = connectDB;