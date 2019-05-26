var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var request = require('request');


const conf = require('./../config/config');

const authServiceIP = conf.authServiceIP;
const authServicePort = conf.authServicePort;
const authServiceURL = "http://" + authServiceIP + ":" + authServicePort + "/auth/v1";

router.get('/register', function (req, res, next) {
    if (!req.is_logged_in) {
        res.render('register', {isLoggedIn : req.is_logged_in, title: 'Register'});
    } else {
        res.location("/");
        res.redirect("/");
    }
});

router.get('/login', function (req, res, next) {
    if (!req.is_logged_in) {
        res.render('login', {isLoggedIn : req.is_logged_in, title: 'Login'});
    } else {
        res.location("/");
        res.redirect("/");
    }
});

router.post('/register', upload.single('profileimage'), function (req, res, next) {
    if (!req.is_logged_in) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var password2 = req.body.password2;

        if (req.file) {
            var profileimage = req.file.filename;
        } else {
            var profileimage = 'noimage.jpg';
        }

        // Form Validation
        req.checkBody('name', 'Name field is required!').notEmpty();
        req.checkBody('email', 'E-mail field is required!').notEmpty();
        req.checkBody('email', 'E-mail is NOT valid!').isEmail();
        req.checkBody('password', 'Password field is required!').notEmpty();
        req.checkBody('password', 'Passwords do NOT match!').equals(req.body.password2);

        var errors = req.validationErrors();
        console.log(errors);

        if (errors) {
            res.render('register', {
                isLoggedIn : req.is_logged_in,
                title: 'Register',
                name: name,
                email: email,
                errors: errors
            })
        } else {
            request.post({
                url: authServiceURL + '/user/register',
                form: {email: email, password: password}
            }, function (error, response, body) {
                if (!error && response.statusCode == 201) {
                    res.location("/users/login");
                    res.redirect("/users/login");
                } else if(!error) {
                    console.log(body);
                    errors = [{
                        location: 'body',
                        param: 'failed',
                        msg: JSON.parse(body)["message"],
                        value: ''
                    }];
                    res.render('register', {
                        isLoggedIn : req.is_logged_in,
                        title: 'Register',
                        errors: errors
                    });
                }
                else{
                    res.render("error", {isLoggedIn : req.is_logged_in, error: error});
                }
            });
        }
    } else {
        res.location("/");
        res.redirect("/");
    }
});

router.post('/login', function (req, res, next) {
    if (!req.is_logged_in) {
        var email = req.body.email;
        var password = req.body.password;

        request.post({
            url: authServiceURL + '/user/login',
            form: {email: email, password: password}
        }, async function (error, response, body) {
            console.log(body);
            if (!error && response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                res.cookie("SID", jsonBody["token"], {});
                await new Promise(resolve => setTimeout(resolve, 1200));
                res.location('/');
                res.redirect('/');
            } else if(error){
                res.render("error", {isLoggedIn : req.is_logged_in, error: error});
            }
            else{
                errors = [{
                    location: 'body',
                    param: 'failed',
                    msg: 'Invalid E-mail or Password!',
                    value: ''
                }];
                res.render('login', {
                    isLoggedIn : req.is_logged_in,
                    title: 'Login',
                    errors: errors
                });
            }
        });
    } else {
        res.location("/");
        res.redirect("/");
    }

});

router.get('/logout', function (req, res, next) {

    if (req.is_logged_in) {
        var token = req.cookies["SID"];
        if (token) {
            request({
                method: "DELETE",
                uri: authServiceURL + "/user/logout",
                headers: {'Authorization': 'Bearer ' + token}
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var d = new Date(); // Today!
                    d.setDate(d.getDate() - 1); // Yesterday!
                    res.cookie("SID", "" ,{ expires: d});
                    res.location("/");
                    res.redirect("/");
                } else {
                    console.log(body);
                    error = body;
                    res.render("error", {isLoggedIn : req.is_logged_in, error: error});
                }
            });
        } else {
            res.location("/");
            res.redirect("/");
        }
    } else {
        res.location("/");
        res.redirect("/");
    }

});

module.exports = router;
