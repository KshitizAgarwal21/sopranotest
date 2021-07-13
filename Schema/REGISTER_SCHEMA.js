var mongoose = require('mongoose');
const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String
    }
});

const REGISTER_SCHEMA = mongoose.model("USER_DATA", schema);
module.exports = REGISTER_SCHEMA;