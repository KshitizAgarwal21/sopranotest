var mongoose = require("mongoose");
const schema = new mongoose.Schema({
    uid: {
        type: String,
        required: true
    },
    posts: [{
        _id: {
            type: String
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        }
    }]
});

const POSTS_SCHEMA = mongoose.model("USER_POST", schema);
module.exports = POSTS_SCHEMA;