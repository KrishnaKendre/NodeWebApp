/*
 * Krishna Kendre
 * CMPSC 421, HW 7
 */

module.exports = function(app) {
    
    // Module dependencies.
    var express = require('express');
    var sanitizer = require('sanitizer');
    var monk = require('monk');
    
    // Setup Connection with mongoDb
    var credentials = require('./credentials.js');
    var db = monk(credentials.username + ":" + credentials.password +
		  "@hbgwebfe.hbg.psu.edu:27017/kdk5120");
    var userCollection = db.get('userlistCollection');

    app.use('/listUser', function(req, res, next) {
        userCollection.find({}, function(err, data) {

            if (err) {         
                console.log(err);
                res.status(500).send("<p>Oooops.</p>");         
            } else {    
                console.log(data);
                res.status(200).send(data);   
            }

        });
    });
    
    // Serve up processSearch.html
    app.use('/bin/processSearch', function(req, res) {
        var sess = req.session;
        sess.recipe = sanitizer.escape(req.body.recipe);

        if (sess.recipe) {
            console.log(JSON.stringify(sess.recipe));
            res.send(sess.recipe);
        } else {
            res.send("You searched for nothing.");
        }
    });

    app.use('/clear', function(req, res) {
	    userCollection.remove({});
        res.status(200).send('<p>database cleared.</p>');
    });
    
    // Serve up processRegister.html    
    app.use('/bin/processRegister', function(req, res) {
        var sUsername = JSON.stringify(sanitizer.escape(req.body.username));
        var sPassword = JSON.stringify(sanitizer.escape(req.body.password));
        var sBirthday = JSON.stringify(sanitizer.escape(req.body.birthday));
        var sEmail = JSON.stringify(sanitizer.escape(req.body.email));

        //check if user entered input in every field
        if (!sUsername) res.send("Username is required.");
        if (!sPassword) res.send("Password is required.");
        if (!sBirthday) res.send("Birthday is required.");
        if (!sEmail) res.send("Email is required.");

        //print user's input to screen
        console.log("User name: " + JSON.stringify(sUsername));
        console.log("password: " + JSON.stringify(sPassword));
        console.log("birthday: " + JSON.stringify(sBirthday));
        console.log("email: " + JSON.stringify(sEmail));

        //1. validate username
        var patt = /\b[A-Za-z]{2,}/;

        if (!patt.test(sUsername) || sUsername.indexOf(" ") != -1){
            res.send("Username must begin with two letters" + " and contain no spaces.");
        }
        
        //2. validate birthday
        var min = new Date("November 20, 1884");
        var bday = new Date(sBirthday);

        if (bday.getFullYear() < 1884) {
            res. send("You're too old. Sorry.");
        } else if (bday.getFullYear() == 1884) {
            if (bday.getMonth() < 10) {
                res.send("You're too old. Sorry.");
            } else if (bday.getMonth() == 10) {
                if (bday.getDate() < 20){
                    res.send("You're too old. Sorry.");
                }
            }
        }

        if (bday.getFullYear() > 2001) {
            res.send("You're too young. Sorry.");
        } else if (bday.getFullYear() == 2001) {
            if (bday.getMonth() > 10) {
                res.send("You're too young. Sorry.");
            } else if (bday.getMonth() == 10) {
                if (bday.getDate() > 20) {
                    res.send("You're too young. Sorry.");
                }
            }
        }

        //3. validate email
        patt = /\b[\w\.]+@[\w\.]+\.[\w]+\b/;

        if (!patt.test(sEmail)) res.send("Invalid email address.");

        //all fields have been validated
        userCollection.findOne({username: sUsername}, function(err, result) {
            if (err) {
                res.status(500).send("<p>Oops!</p>");
                console.log(err);
            }

            if (result) {
            res.send("Username already exists. Try another username.");
            } else {

                var doc = {
                    username: sUsername,
                    password: sPassword,
                    birthday: sBirthday,
                    email: sEmail
                };

                userCollection.insert(doc);
                req.session.regenerate(function(err) {
                    if(err) {
                    res.send("Error during session regeneration: ");
                    console.log(err);
                            }
                        });
                var sess = req.session;
                sess.username = sUsername;
                sess.password = sPassword;

                res.location('/public/processSearch.html');
                res.redirect('/public/processSearch.html');
            }
        });
        
    });

    // Serve up processLogin.html     
    app.use('/bin/processLogin', function(req, res) {
        var sess = req.session;
        var sUsername = JSON.stringify(sanitizer.sanitize(req.body.userName));
        var sPassword = JSON.stringify(sanitizer.sanitize(req.body.password));

        console.log('username: ' + sUsername);
        console.log('password: ' + sPassword);

        if (!sUsername || !sPassword) {
            res.send("Please enter both fields.");
        }
        //validate username
        var patt = /\b[A-Za-z]{2,}/;

        if (!patt.test(sUsername) || sUsername.indexOf(" ") != -1) {
            res.send("Username must begin with two letters" + " and contain no spaces.");
        }
        
        userCollection.findOne({username: sUsername}, function(err, data) {
            if (err) {
                console.log(err);
                res.status(500).send("<p>Problem with server.</p>");
            }

            if (!data) {
                res.send("Wrong credentials.");
                console.log('username not found.');
            } else if (data.password != sPassword) {
                res.send("Wrong credentials.");
                console.log('wrong password.');
            } else {
                req.session.regenerate(function(err) {
                    if (err) {
                        res.send('Error during session regeneration');
                        console.log(err);
                    }
                });
                sess = req.session;
                sess.username = sUsername;
                sess.password = sPassword;
                res.location('/public/processSearch.html');
                res.redirect('/public/processSearch.html');
            }
        });
    });

    app.use('/whoami.html', function(req, res) {
        var sess = req.session;

        userCollection.findOne({username: sess.username}, function(err, data) {
            if (err) {
                console.log(err);
                res.status(500).send('<p>Ooops!</p>');
            } else if (data) {
                res.send('<p>username: ' + data.username + '</p>' +
                         '<p>password: ' + data.password + '</p>' +
                         '<p>birthday: ' + data.birthday + '</p>' +
                         '<p>email: ' + data.email + '</p>');
            } else {
                res.send('You\'re not logged in.');
            }
        });
    });
};

console.log('methods.js is running now. ');