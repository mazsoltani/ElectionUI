var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var request = require('request');
const {check} = require('express-validator/check');

const conf = require('./../config/config');

const electionManagerServiceIP = conf.electionManagerServiceIP;
const electionManagerServicePort = conf.electionManagerServicePort;
const electionManagerServiceURL = "http://" + electionManagerServiceIP + ":" + electionManagerServicePort;

const electionPortalServiceIP = conf.electionPortalServiceIP;
const electionPortalServicePort = conf.electionPortalServicePort;
const electionPortalServiceURL = "http://" + electionPortalServiceIP + ":" + electionPortalServicePort;


router.get('/vote/elections/:electionId/', function (req, res, next) {


    if(req.is_logged_in && req.user_data["role"] == "user"){
        //getting the election details
        request({
            method: "GET",
            uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/get"
        }, function (error, response, body) {
            if (response.statusCode == 200) {
                var electionDetailsJSON = JSON.parse(body)["data"];
                //getting choices of the election
                request({
                    method: "GET",
                    uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/choices/all"
                }, function (error, response, body) {
                    if (response.statusCode == 200) {
                        var electionChoiceDetailsJSON = JSON.parse(body)["data"];
                        res.render('electionPortal/vote', {
                            isLoggedIn : req.is_logged_in,
                            title: 'voting',
                            election: electionDetailsJSON,
                            choices: electionChoiceDetailsJSON
                        });

                    } else {
                        console.log("error getting the election choices to load vote page");
                        res.render('manageElection/error', {isLoggedIn : req.is_logged_in,title: "error getting the election choices", error: body});
                    }
                });
            } else {
                console.log("error getting the election details to load vote page");
                res.render('manageElection/error', {isLoggedIn : req.is_logged_in,title: "error getting the election details", error: body});
            }
        });
    }
    else{
        res.location("/");
        res.redirect("/");
    }


});

router.post('/vote/elections/:electionId/', function (req, res, next) {

    if(req.is_logged_in && req.user_data["role"] == "user"){
        var electionId = req.params.electionId;
        var choiceId = req.body.electionChoiceId;
        var voterUserId = req.user_data["email"];

        //checking if the choiceId is valid
        request({
                method: "GET",
                uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/choices/" + choiceId + "/get"
            },
            function (error, response, body) {
                if (response.statusCode == 200) {

                    // should also check if the user has already voted
                    request({method:"GET", uri: electionPortalServiceURL + "/allowedToVote", qs:{ voterUserId: voterUserId, electionId : electionId } },
                        function (error, response, body) {
                            if (response.statusCode == 200) {
                                // submiting the vote
                                request({
                                        method: "GET",
                                        uri: electionPortalServiceURL + "/saveVote",
                                        qs: {electionId: req.params.electionId, choiceNumber: choiceId, voterUserId: voterUserId}
                                    },
                                    function (error, response, body) {
                                        if (response.statusCode == 200) {

                                            //incrementing the total vote count of election manager
                                            request({
                                                    method: "GET",
                                                    uri: electionManagerServiceURL + "/elections/votes/increment",
                                                },
                                                function (error, response, body) {
                                                    if (response.statusCode == 200) {
                                                        res.location('/portal/vote/thanks');
                                                        res.redirect('/portal/vote/thanks');
                                                    } else {
                                                        console.log("error when incrementing the number of total votes for election manager");
                                                        res.render('manageElection/error', {
                                                            isLoggedIn : req.is_logged_in,
                                                            title: "error when incrementing the number of total votes for election manager",
                                                            error: body
                                                        });
                                                    }
                                                });
                                        } else {
                                            console.log("error when submitting the vote");
                                            res.render('manageElection/error', {
                                                isLoggedIn : req.is_logged_in,
                                                title: "error when submitting the vote",
                                                error: body
                                            });
                                        }
                                    });
                            } else {
                                console.log("error, user has already voted!");
                                res.render('manageElection/error', {isLoggedIn : req.is_logged_in,title: "error, user has already voted!"});
                            }
                        });
                } else {
                    console.log("error, choice not found for this election");
                    res.render('manageElection/error', {isLoggedIn : req.is_logged_in,title: "error, choice not found for this election", error: body});
                }
            });
    }
    else{
        res.location("/");
        res.redirect("/");
    }


});

router.get('/vote/thanks', function (req, res, next) {
    if(req.is_logged_in && req.user_data["role"] == "user"){
        res.render("electionPortal/thanksForVoting", {isLoggedIn : req.is_logged_in})
    }
    else{
        res.location("/");
        res.redirect("/");
    }
});

module.exports = router;