var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.is_logged_in){
        res.render('index', {
            title: 'Welcome to FUM election' ,
            isLoggedIn : req.is_logged_in,
            userEmail : req.user_data["email"],
            role : req.user_data["role"]
        });
    }
    else{
        res.render('index', { title: 'Welcome to FUM election', isLoggedIn : req.is_logged_in  });
    }
});


module.exports = router;
