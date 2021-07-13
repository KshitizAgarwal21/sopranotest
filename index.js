var express = require('express');
var app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());
var bcrypt = require('bcrypt');
const mySaltRounds = 10;
const jwt = require("jsonwebtoken");
var mongoose = require('mongoose');
var REGISTER_SCHEMA = require('./Schema/REGISTER_SCHEMA');
const POSTS_SCHEMA = require('./Schema/POSTS_SCHEMA.JS');
const { ObjectId } = require('bson');
const path = require("path");
const PORT = 8080 || PROCESS.env.PORT;
const fname = new Date().getTime().toString();
var multer = require('multer');
var upload = multer({ storage: storage })
// const uploadFile = require('./Middleware/upload')
const prodURL = "mongodb+srv://Kshitiz_Agarwal:FJ9EiIfKDWGb6nzS@cluster0.mkzhm.mongodb.net/Soprano?retryWrites=true&w=majority";
app.listen(PORT, (err) => {

    console.log("Server started successfully at port " + PORT);
});

mongoose.connect(prodURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    console.log("Connected to Database");
});
// Folder to store profile pics
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const file_name = fname;
        cb(null, file_name);
    }
});
// Function to upload profile pic
const maxSize = 1000 * 1000 * 1000;
var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);

        var extname = filetypes.test(path.extname(
            file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb("Error: File upload only supports the "
            + "following filetypes - " + filetypes);
    }
}).single("file");


// Register New User
app.post('/register', async (req, res) => {

    const already_exists = await REGISTER_SCHEMA.findOne({ email: req.body.email });
    if (already_exists) {
        res.status(400).send({ msg: "User already exists in database" });
    }
    else {
        const _password = req.body.password;
        const hashed_password = await bcrypt.hash(_password, mySaltRounds);
        console.log(hashed_password);
        var user_details = {
            name: req.body.name,
            email: req.body.email,
            password: hashed_password,
            image: req.body.image
        }
        const user = new REGISTER_SCHEMA(user_details);
        try {
            const result = await user.save();

            if (result) {
                const user_data = {
                    name: req.body.name,
                    email: req.body.email,
                    image: req.body.image
                }
                const token = jwt.sign(user_data, "mysalt");
                res.status(200).send({ msg: "Registration Successful", token: token });
            }
        }
        catch (e) {
            res.status(500).send({ msg: "Bad Request" });
        }
    }

})


//Login User

app.post('/login', async (req, res) => {
    console.log(req.body);
    const user_exists = await REGISTER_SCHEMA.findOne({ email: req.body.email });
    if (!user_exists) {
        res.status(400).send({ msg: "User does not exist in our database" });
    }
    else {
        const valid_user = await bcrypt.compare(req.body.password, user_exists.password);
        if (valid_user) {
            const user = {
                uid: user_exists._id,
                name: user_exists.name,
                email: user_exists.email,
                image: user_exists.image
            }
            var user_token = jwt.sign(user, "mysalt");
            res.status(200).send({ msg: "Logged in successfully", token: user_token })
        }
        else {
            res.status(400).send({ msg: "Invalid username or password" });
        }
    }

})

//Create  a new Post

app.post('/newpost', async (req, res) => {
    //Check if user logged in
    if (req.headers.authorization == null) {
        res.status(400).send({ msg: "Kindly login to continue" });
    }
    else {
        const uid = jwt.verify(req.headers.authorization, "mysalt").uid;
        var user_post = {
            uid: uid,
            posts: {
                _id: ObjectId(),
                title: req.body.title,
                description: req.body.description,
                image: req.body.image,
            }
        }
        //Find the logged in user
        const posted_before = await POSTS_SCHEMA.findOne({ uid: uid });
        if (posted_before) {
            const posted = await POSTS_SCHEMA.findOneAndUpdate({ uid: uid }, { $push: { posts: { title: req.body.title, description: req.body.description, image: req.body.image, _id: ObjectId() } } });
            if (posted) {
                res.status(200).send({ msg: "New Post Added Successfully" });
            }
            else {
                res.status(200).send({ msg: "Some error occured" });
            }
        }
        else {
            const post = new POSTS_SCHEMA(user_post);
            try {
                const posted = await post.save();
                if (posted) {
                    res.status(200).send({ msg: "Posted Successfully" });
                }
            }
            catch (e) {
                res.status(500).send({ msg: "Bad Request" });
            }
        }
    }
})

//Retrieve posts by ID

app.post('/myposts', async (req, res) => {
    if (req.headers.authorization == null) {
        res.status(400).send({ msg: "Kindly login to continue" });
    }
    else {
        const uid = jwt.verify(req.headers.authorization, "mysalt").uid;

        const myposts = await POSTS_SCHEMA.findOne({ uid: uid });
        if (myposts) res.status(200).send({ myposts });
        else res.status(400).send({ msg: "No posts exists for the user" });
    }
})
// Retrieve all the posts by all users
app.post('/allposts', async (req, res) => {
    if (req.headers.authorization == null) {
        res.status(400).send({ msg: "Kindly login to see the posts" });
    }
    else {
        const allposts = await POSTS_SCHEMA.find({});
        res.status(200).send(allposts);
    }
})

//Find and delete post

app.delete('/deletepost', async (req, res) => {
    if (req.headers.authorization == null) {
        res.status(400).send({ msg: "Kindly login to continue" });
    }
    else {
        const uid = jwt.verify(req.headers.authorization, "mysalt").uid;
        const pid = req.body._id;

        const deleted = await POSTS_SCHEMA.findOneAndUpdate({ uid: uid, "posts._id": pid }, { $pull: { posts: { _id: pid } } });
        if (deleted) res.status(200).send({ msg: "Post deleted successfully" })
        else res.status(400).send({ msg: "Bad Request" });
    }
})

//Find and update post

app.post('/modifypost', async (req, res) => {
    if (req.headers.authorization == null) {
        res.status(400).send({ msg: "Kindly login to continue" });
    }
    else {
        const uid = jwt.verify(req.headers.authorization, "mysalt").uid;
        const pid = req.body._id;

        const modified = await POSTS_SCHEMA.findOneAndUpdate({ uid: uid, "posts._id": pid },
            { $set: { "posts.$": { _id: pid, title: req.body.title, description: req.body.description, image: req.body.image } } })
        if (modified) res.status(200).send({ msg: "Post updated successfully" })
        else res.status(400).send({ msg: "Bad Request" });
    }
})

//Upload user profile pic
app.post('/upload', (req, res, next) => {
    const file_name = fname;
    upload(req, res, function (err) {
        console.log(file_name);
        if (err) {
            res.send(err)
        }
        else {
            res.status(200).send({ msg: "Success, Image uploaded!", filename: file_name })
        }
    })
})
//Upload user posts pic
app.post('/postimage', (req, res, next) => {
    const file_name = fname;
    upload(req, res, function (err) {
        console.log(file_name);
        if (err) {
            res.send(err)
        }
        else {
            res.status(200).send({ msg: "Success, Image uploaded!", filename: file_name })
        }
    })
})