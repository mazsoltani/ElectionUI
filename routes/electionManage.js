var express = require('express');
var router = express.Router();
// var multer = require('multer');
// var upload = multer({dest: 'uploads/'});
var request = require('request');
const {check} = require('express-validator/check')

const electionManagerServiceIP = "127.0.0.1";
const electionManagerServicePort = "8080";

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};


router.get('/create', function (req, res, next) {
    res.render('manageElection/electionCreate', {title: 'create election'});
});

router.post('/create', function (req, res) {
    console.log(req.body);
    var electionName = req.body.electionName;

    var electionStartTime = req.body.electionStartTime;
    var electionStartDate = req.body.electionStartDate;

    var electionEndTime = req.body.electionEndTime;
    var electionEndDate = req.body.electionEndDate;

    //validating if all required values are satisfied
    req.checkBody('electionName', 'election name field is required!').notEmpty();
    req.checkBody('electionStartTime', 'election start time field is required!').notEmpty();
    req.checkBody('electionStartDate', 'election start date field is required!').notEmpty();
    req.checkBody('electionEndTime', 'election end time field is required!').notEmpty();
    req.checkBody('electionEndDate', 'election end date field is required!').notEmpty();
    req.checkBody('electionName', "election name should be between 4 and 25 characters").isLength({min: 4, max: 25});
    // req.checkBody('electionStartDate',"invalid election start date").isDate();
    // req.checkBody('electionEndDate',"invalid election end date").isDate();

    var errors = req.validationErrors();
    console.log(errors);

    if (errors) {
        res.render('manageElection/electionCreate', {
            title: 'create election',
            errors: errors
        })
    } else {

        electionStartDateSplitted = electionStartDate.split('-');
        electionStartTimeSplitted = electionStartTime.split(':');
        electionEndDateSplitted = electionEndDate.split('-');
        electionEndTimeSplitted = electionEndTime.split(':');

        var d1 = new Date();
        d1.setFullYear(electionStartDateSplitted[0], electionStartDateSplitted[1], electionStartDateSplitted[2]);
        d1.setUTCHours(electionStartTimeSplitted[0]);
        d1.setUTCMinutes(electionStartTimeSplitted[1]);
        d1.setUTCSeconds(0);
        // console.log(d1.toJSON());

        var d2 = new Date();
        d2.setFullYear(electionEndDateSplitted[0], electionEndDateSplitted[1], electionEndDateSplitted[2]);
        d2.setUTCHours(electionEndTimeSplitted[0]);
        d2.setUTCMinutes(electionEndTimeSplitted[1]);
        d2.setUTCSeconds(0);
        // console.log(d2.toJSON());


        var options = {
            method: "POST",
            uri: "http://" + electionManagerServiceIP + ":" + electionManagerServicePort + "/elections/save",
            json: {
                "name": electionName,
                "startTime": d1.toJSON(),
                "endTime": d2.toJSON()
            }
        };

        request(
            options,
            function (error, response, body) {
                console.log("1");
                if (response.statusCode == 200) {
                    console.log("2");
                    res.render('manageElection/electionCreate', {title: 'create election'});
                } else {
                    console.log("3");
                    console.log("error calling the create election API");
                    res.render('manageElection/electionCreate', {
                        title: 'create election',
                        errors: body.toString()
                    })
                }

            }
        );

    }
});

router.get('/:electionId/edit', function (req, res) {
    var options = {
        method: "GET",
        uri: "http://" + electionManagerServiceIP + ":" + electionManagerServicePort + "/elections/" + req.params.electionId + "/get",
    };

    request(options, function (error, response, body) {

        if (response.statusCode == 200){
            var bodyJson = JSON.parse(body);
            var startDateTimeString = bodyJson["data"]["startTime"];
            var d1 = new Date(startDateTimeString);

            var electionObj = {
                name : bodyJson["data"]["name"],
                startTime : d1.getHours()+":"+d1.getMinutes(),
                startDate: d1.getFullYear() + "-" + d1.getMonth() + "-" + d1.getDay(),
                // endTime: ,
                // endDate:
            };
            res.render('manageElection/electionCreate', {title: 'editing election', electionObj: electionObj});
        }
        else{
            console.log("error");
        }
    });
});

router.post('/:electionId/edit');

router.get('/remove');

router.get('/all', function (req, res, next) {
    request('http://127.0.0.1:8080/elections/all', function (error, response, body) {
        //proper response handling
        //todo
        res.render('manageElection/electionsAll', {title: "all elections", data: body});
    });

});


router.get("/:electionId/choices/create", function (req, res, next) {
    res.render('manageElection/electionChoiceCreate', {
        title: "adding choices for election " + req.params.electionId,
        electionId: req.params.electionId
    });
});

router.post("/:electionId/choices/create", function (req, res, next) {
    var choicetext = req.body.choicetext;

    req.checkBody('choicetext', "choice text should not be longer than 50").isLength({min: 1, max: 50});

    var errors = req.validationErrors();
    console.log(errors);

    if (errors) {
        res.render('manageElection/electionCreate', {
            title: 'create election',
            errors: errors
        })
    } else {


        var options = {
            method: "POST",
            uri: "http://" + electionManagerServiceIP + ":" + electionManagerServicePort + "/elections/" + req.params.electionId + "/choices/save",
            json: {
                "choice": choicetext.toString(),
            }
        };
        request(options,function (error, response, body) {
            if(response.statusCode == 200){
                res.location('/elections/'+req.params.electionId+'/choices/all');
                res.redirect('/elections/'+req.params.electionId+'/choices/all');
            }
            else{
                res.render('manageElection/electionChoiceCreate', {
                    title: "adding choices for election " + req.params.electionId,
                    electionId: req.params.electionId, errors:body
                });
            }
        });

    }
});

router.get('/:electionId/choices/edit');

router.post('/:electionId/choices/edit');

router.get('/:electionId/choices/remove');

router.get("/:electionId/choices/all", function (req, res, next) {
    request('http://127.0.0.1:8080/elections/' + req.params.electionId + '/choices/all', function (error, response, body) {
        //proper response handling
        if (response.statusCode == 200) {
            res.render('manageElection/getAllElectionChoices', {title: "all elections", data: body});
        } else {
            console.log("error calling the api");
            res.render('manageElection/getAllElectionChoices', {title: "all elections", data: body});
        }
    });
});

router.get("/votes/increment");

module.exports = router;