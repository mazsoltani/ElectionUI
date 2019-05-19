var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var expressValidator = require('express-validator');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var mongo = require('mongodb');
var mongoose = require('mongoose');
var db = mongoose.connection;
var request = require('request');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var electionManageRouter = require('./routes/electionManage');
var electionPortalRouter = require('./routes/electionPortal');


const conf = require('./config/config');

const authServiceIP = conf.authServiceIP;
const authServicePort = conf.authServicePort;
const authServiceURL = "http://" + authServiceIP + ":" + authServicePort + "/auth/v1";


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Handle Sessions
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Express-Validator
app.use(expressValidator());

app.use(function (req, res, next) {
        // check if it has cookie
        var token = req.cookies["SID"];
        if (token) {
            // check if cookie is logged in
            request({
                method: "GET",
                uri: authServiceURL + "/validate/token",
                headers: {'Authorization': 'Bearer ' + token}
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // get the user info
                    request({
                        method: "GET",
                        uri: authServiceURL + "/user/role",
                        headers: {'Authorization': 'Bearer ' + token}
                    }, function (error, response, body) {
                        if(!error && response.statusCode == 200){
                            var jsonBody = JSON.parse(body);
                            req.is_logged_in = true;
                            req.user_data = jsonBody;
                            next();
                        }else{
                            console.log("error calling the /user/role API !");
                            console.log(error);
                            req.is_logged_in = false;
                            next();
                            }

                    });
                } else {
                    req.is_logged_in = false;
                    next();
                }
            });
        } else {
            req.is_logged_in = false;
            next();
        }

});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/elections', electionManageRouter);
app.use('/portal', electionPortalRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
