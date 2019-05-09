var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var request = require('request');
const { check } = require('express-validator/check')

const electionPortalServiceIP = "127.0.0.1";
const electionPortalServicePort = "8080";



router.get('/vote', function(req, res, next) {
    res.render('electionPortal/vote', {title: 'voting'});
});

router.post('/vote', function (req, res, next) {
    //todo
} );