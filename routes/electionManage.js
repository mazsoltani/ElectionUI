var express = require('express');
var router = express.Router();
var request = require('request');
const {check} = require('express-validator/check')

const electionManagerServiceIP = "127.0.0.1";
const electionManagerServicePort = "8080";
const electionManagerServiceURL = "http://" + electionManagerServiceIP + ":" +  electionManagerServicePort;

function formatNumber(myNumber){
    return ("0" + myNumber).slice(-2);
}


router.get('/create', function (req, res) {
    res.render('manageElection/electionCreate', {title: 'create election'});
});

router.post('/create', function (req, res) {
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
        var d2 = new Date();

        d1.setFullYear(electionStartDateSplitted[0], electionStartDateSplitted[1], electionStartDateSplitted[2]);
        d1.setUTCHours(electionStartTimeSplitted[0]);
        d1.setUTCMinutes(electionStartTimeSplitted[1]);
        d1.setUTCSeconds(0);


        d2.setFullYear(electionEndDateSplitted[0], electionEndDateSplitted[1], electionEndDateSplitted[2]);
        d2.setUTCHours(electionEndTimeSplitted[0]);
        d2.setUTCMinutes(electionEndTimeSplitted[1]);
        d2.setUTCSeconds(0);

        var options = {
            method: "POST",
            uri: electionManagerServiceURL + "/elections/save",
            json: {
                "name": electionName,
                "startTime": d1.toJSON(),
                "endTime": d2.toJSON()
            }
        };

        request(
            options,
            function (error, response, body) {
                if (response.statusCode == 200) {
                    res.location('/elections/all');
                    res.redirect('/elections/all');
                } else {
                    console.log("error calling the create election API");
                    res.render('manageElection/error', {
                        title: 'error when calling the create election API ',
                        error: body.toString()
                    })
                }

            }
        );

    }
});

router.get('/:electionId/edit', function (req, res) {
    var options = {
        method: "GET",
        uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/get",
    };

    request(options, function (error, response, body) {

        if (response.statusCode == 200){
            var bodyJson = JSON.parse(body);
            var startDateTimeString = bodyJson["data"]["startTime"];
            var endDateTimeString = bodyJson["data"]["endTime"];

            var d1 = new Date(startDateTimeString);
            var d2 = new Date(endDateTimeString);

            var electionObj = {
                name : bodyJson["data"]["name"],
                startTime : formatNumber(d1.getUTCHours())+":"+formatNumber(d1.getUTCMinutes()),
                startDate: d1.getFullYear() + "-" + formatNumber(d1.getUTCMonth()) + "-" + formatNumber(d1.getUTCDate()),
                endTime: formatNumber(d2.getUTCHours())+":"+formatNumber(d2.getUTCMinutes()),
                endDate: d2.getFullYear() + "-" + formatNumber(d2.getUTCMonth()) + "-" + formatNumber(d2.getUTCDate())
            };
            res.render('manageElection/electionCreate', {title: 'editing election', electionObj: electionObj});
        }
        else{
            res.render('manageElection/error', {
                title: 'error when getting the election details from the API ',
                error: body.toString()
            })
        }
    });
});

router.post('/:electionId/edit', function (req, res) {
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

        var d2 = new Date();
        d2.setFullYear(electionEndDateSplitted[0], electionEndDateSplitted[1], electionEndDateSplitted[2]);
        d2.setUTCHours(electionEndTimeSplitted[0]);
        d2.setUTCMinutes(electionEndTimeSplitted[1]);
        d2.setUTCSeconds(0);

        var options = {
            method: "POST",
            uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/update",
            json: {
                "id": req.params.electionId,
                "name": electionName,
                "startTime": d1.toJSON(),
                "endTime": d2.toJSON()
            }
        };

        request(
            options,
            function (error, response, body) {
                if (response.statusCode == 200) {
                    res.location('/elections/all');
                    res.redirect('/elections/all');
                } else {
                    console.log("error when calling the update election API");
                    res.render('manageElection/error', {
                        title: 'error when calling the update election API',
                        error: body.toString()
                    })
                }

            }
        );

    }
});

router.get('/:electionId/remove', function (req, res) {
    // cheking if election exists at first
    var options = {
        method: "GET",
        uri : electionManagerServiceURL + "/elections/exists",
        qs : { electionId : req.params.electionId }
    };

    request(options, function (error, response, body) {
        if(response.statusCode != 200){
                res.render('manageElection/error', {
                    title: 'election does not exists to remove',
                    error: "election with id "+ req.params.electionId +" does not exists"
                })
        }
        else{
            var options = {
                method: "GET",
                uri : electionManagerServiceURL + "/elections/"+req.params.electionId+"/remove"
            };
            request(options,function (error, response, body) {
                if (response.statusCode == 200){
                    res.location('/elections/all');
                    res.redirect('/elections/all');
                }
                else{
                    console.log("error calling the remove election API");
                    res.render('manageElection/error', {
                        title: 'error when calling the remove election API',
                        error: body.toString()
                    })
                }
            });
        }
    });
});

router.get('/all', function (req, res) {
    request(electionManagerServiceURL + '/elections/all', function (error, response, body) {
        if (response.statusCode == 200) {
            res.render('manageElection/electionsAll', {title: "all elections", data: body});
        }
        else{
            res.render("manageElection/error",{title: "error receiving all of the elections", error:body});
        }
    });

});

router.get("/:electionId/choices/create", function (req, res) {
    res.render('manageElection/electionChoiceCreate', {
        title: "adding choices for election " + req.params.electionId,
        electionId: req.params.electionId
    });
});

router.post("/:electionId/choices/create", function (req, res) {
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
            uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/choices/save",
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
                res.render('manageElection/error', {
                    title: "adding choices for election " + req.params.electionId,
                    electionId: req.params.electionId, error:body
                });
            }
        });

    }
});

router.get('/:electionId/choices/:choiceId/edit', function (req,res) {

    var options = {
        method: "GET",
        uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/choices/"+req.params.choiceId+"/get",
    };
    request(options, function (error, response, body) {
        if(response.statusCode == 200){
            var bodyJson = JSON.parse(body);
            var choiceObj = bodyJson["data"];
            res.render("manageElection/electionChoiceCreate", { choiceObj : choiceObj ,title: "editing election choice"});
        }
        else{
            res.render("manageElection/error",{ title:"error editing election choice" , error:body });
        }
    })
});

router.post('/:electionId/choices/:choiceId/edit', function (req, res) {
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
            uri: electionManagerServiceURL + "/elections/" + req.params.electionId + "/choices/"+ req.params.choiceId +"/update",
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
                res.render('manageElection/error', {
                    title: "adding choices for election " + req.params.electionId,
                    electionId: req.params.electionId, error:body
                });
            }
        });

    }
});

router.get('/:electionId/choices/:choiceId/remove', function (req, res) {
    //checking if the election choice exists
    var options = {
        method: "GET",
        uri : electionManagerServiceURL + "/elections/"+ req.params.electionId +"/choices/"+ req.params.choiceId+"/get",
        // qs : { electionId : req.params.electionId }
    };

    request(options, function (error, response, body) {
        if (response.statusCode == 200){
            var options = {
                uri : electionManagerServiceURL + "elections/"+ req.params.electionId +"/choices/"+ req.params.choiceId +"/remove"
            };
            request(options,function (error, response, body) {
                if (response.statusCode == 200){
                    res.location("elections/"+ req.params.electionId +"/choices/"+ req.params.choiceId+"/all");
                    res.redirect("elections/"+ req.params.electionId +"/choices/"+ req.params.choiceId+"/all");
                }
                else{
                    console.log("error calling the remove election choice API");
                    res.render('manageElection/error', {
                        title: 'removing election choice failed',
                        errors: body.toString()
                    })
                }
            });
        }
        else{
            console.log("error calling the remove election choice API");
            res.render('manageElection/error', {
                title: 'error when calling the remove choice election API',
                error: body.toString()
            })
        }
    });

});

router.get("/:electionId/choices/all", function (req, res) {
    request(electionManagerServiceURL + 'elections/' + req.params.electionId + '/choices/all', function (error, response, body) {
        //proper response handling
        if (response.statusCode == 200) {
            res.render('manageElection/getAllElectionChoices', {title: "all elections", data: body});
        } else {
            console.log("error calling the api");
            res.render('manageElection/error', {title: "all elections", error: body});
        }
    });
});


module.exports = router;