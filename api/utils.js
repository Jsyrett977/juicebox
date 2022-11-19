const requireUser = (req, res, next) => {
    if(!req.user){
        next({
            name: "MissingUser",
            message: "You must be logged in to continue"
        })
    }
    next();
}
module.exports = {
    requireUser
}