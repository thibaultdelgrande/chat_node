const mongoose = require('mongoose');
require("dotenv").config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri);
