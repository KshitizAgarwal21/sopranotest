const jwt = require('jsonwebtoken');
const RouteGuard = (req, res, next) => {
    var token = req.headers.authorization;
    if (token == null) {
        res.status(400).send({ msg: "Unauthorised access request" });
    }
    else {
        const user_info = jwt.verify(token, "mysalt");
        if (user_info) {
            req.user_info = user_info;
            next();
        }
        else res.status(400).send({ msg: "Unauthorised access request" });

    }
}

module.exports = RouteGuard;