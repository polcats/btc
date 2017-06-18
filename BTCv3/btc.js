var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(session({
    secret: 'xxx'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('views'));

var sess;
var port = 90;
var currentDB = "teacherscamp";
var currentHost = "127.0.0.1";
var dbuser = "root";
var dbpass = "";
var mysql = require('mysql');

// assign port
app.listen(port, function() {
    console.log("App Started on PORT " + port);
});

function submitToDB(post, dbName, tableName) {
    var connection = mysql.createConnection({
        host: currentHost,
        user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect(function(err) {
        // in case of error
        if (err) {
            //console.log(err);
        }
    });
    // submit the data
    connection.query('INSERT INTO ' + tableName + ' SET ?', post, function(err, result) {
        if (err) {
            //console.log("Insert error: " + err);
        }
    });
    // the connection has been closed
    connection.end(function() {});
}

function queryDB(query) {
    var connection = mysql.createConnection({
        host: currentHost,
        user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect(function(err) {
        if (err) {
            //console.log(err);
        }
    });
    connection.query(query, function(err, rows, fields) {});
    connection.end(function() {});
}
//waka

// index
app.get('/', function(req, res) {

    res.redirect("/home");

});

// login Submission
app.post('/login', function(req, res) {

    sess = req.session;
    sess.username = req.body.username;
    sess.password = req.body.password;

    var connection = mysql.createConnection({
        host: currentHost,
        user: dbuser,
        password: dbpass,
        database: currentDB,
    });

    connection.connect(function(err) {
        if (err) {
            //console.log(err);
        }
    });
    connection.query("SELECT * from employees where (username='" + sess.username + "' and password='" + sess.password + "')",
        function(err, rows, fields) {
            if (err) {
               // console.log(err);
                return;
            }
            if (rows.length == 1) { // match
                sess = req.session;
                sess.username = req.body.username;
                sess.cid = rows[0].clientno;
                res.render("logged-in.html");
            } else {
                req.session.destroy(function(err) {
                    if (err) {
                        //console.log(err);
                    } else {
                       // console.log("Failed login!");
                        res.render("logged-in-failed.html");
                    }
                });
                return false;
            }
        });
    connection.end(function() {});

});

// login | Home page
app.get('/home', function(req, res) {
    sess = req.session;
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var action = params.action;

    if (sess.username && action != "logout") { // already logged in
        res.render("home.html");
        res.end();
    } else if (action == "logout") {
        req.session.destroy(function(err) {
            if (err) {
                //console.log(err);
            } else {
                //console.log("Logged out!");
                res.redirect('/home');
            }
        });
    } else {
        res.render("login.html");
        res.end();
        return false;  
    }

});

app.get('/currentmonthreservations', function(req, res) {
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(`select * from reservations where status != 'request' order by arrival asc`, function(err, rows, fields) {

                if(rows.length > 0) {
                   for(i = 0; i < rows.length; i++){
                      var d = new Date(rows[i].arrival);
                      var month = new Array();
                        month[0] = "January";
                        month[1] = "February";
                        month[2] = "March";
                        month[3] = "April";
                        month[4] = "May";
                        month[5] = "June";
                        month[6] = "July";
                        month[7] = "August";
                        month[8] = "September";
                        month[9] = "October";
                        month[10] = "November";
                        month[11] = "December";

                      var n = month[d.getMonth()];
                      var k = month[(new Date()).getMonth()];
                      if(k == n) {
                          res.write(`
                                    <tr>
                                        <td>`+new String(rows[i].arrival).slice(0, 15)+`</td>
                                        <td>`+new String(rows[i].departure).slice(0, 15)+`</td>
                                        <td>`+rows[i].name+`</td>
                                        <td>`+rows[i].activity+`</td>
                                        <td>`+rows[i].status+`</td>
                                        <td>`+rows[i].contact_no1+`</td>
                                        <td>`+rows[i].contact_no2+`</td>
                                     </tr>
                            `);
                          }
                      }
                } else {
                    res.write(`<tr> <td colspan="6"> No reservations this month. </td> </tr>`);
                }

           res.end();
        });
    connection.end();
});

app.get('/dailyarrivals', function(req, res) {
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(`select * from reservations where status != 'request' order by arrival asc`, function(err, rows, fields) {
            var item = 0;
                if(rows.length != 0) {
                   for(i = 0; i < rows.length; i++){

                      var d = new String(new Date(rows[i].arrival)).slice(0, 15);
                      var k = new String(new Date()).slice(0, 15);

                      if(k == d) {
                          item++;
                          res.write(`
                                    <tr>
                                        <td>`+rows[i].name+`</td>
                                        <td>`+rows[i].activity+`</td>
                                        <td>`+rows[i].status+`</td>
                                        <td>`+rows[i].contact_no1+`</td>
                                        <td>`+rows[i].contact_no2+`</td>
                                     </tr>
                            `);
                          }
                    }
                    if(item == 0) {
                        res.write(`<tr> <td colspan="6"> No reservations today. </td> </tr>`);
                    }
                } else {
                    res.write(`<tr> <td colspan="6"> No reservations today. </td> </tr>`);
                }
           res.end();
        });
    connection.end();
});


app.get('/reservations', function(req, res) {
    res.render("reservation.html");
});

app.get('/reservationsList', function(req, res) {
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(`select * from reservations order by arrival asc`, function(err, rows, fields) {
                if(rows.length != 0) {
                   for(i = 0; i < rows.length; i++){
                          res.write(`
                                    <tr>
                                        <td>`+new String(rows[i].arrival).slice(0, 15)+`</td>
                                        <td>`+new String(rows[i].departure).slice(0, 15)+`</td>
                                        <td>`+rows[i].name+`</td>
                                        <td>`+rows[i].activity+`</td>
                                        <td>`+rows[i].status+`</td>
                                        <td>`+rows[i].contact_no+`</td>
                                        <td><a button type="submit" class="btn btn-info btn-sm btn-fill pull-left" href="/viewDetails?id=`+rows[i].id+`">View Details</a>
                                       </td>
                                     </tr>
                            `);
                           
                      }
                } 
           res.end();
        });
    connection.end();
});

app.get('/guests', function(req, res) {
    res.render("guests.html");
});

app.get('/guestrecords', function(req, res) {
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(`select * from reservations order by arrival asc`, function(err, rows, fields) {
                if(rows.length != 0) {
                   for(i = 0; i < rows.length; i++){
                            res.write(`
                                    <tr>
                                        <td>`+rows[i].id+`</td>
                                        <td>`+rows[i].name+`</td>
                                        <td>`+rows[i].contact_no+`</td>
                                        <td>`+rows[i].guest_type+`</td>
                                        <td>`+new String(rows[i].arrival).slice(0, 15)+`</td>
                                        <td>`+new String(rows[i].departure).slice(0, 15)+`</td>
                                        <td>`+rows[i].no_persons+`</td>
                                        <td>`+rows[i].activity+`</td>
                                        <td>`+rows[i].status+`</td>
                                     </tr>
                            `);
                          }
                    }
           res.end();
        });
    connection.end();
});


app.get('/newReservation',function(req,res){
    sess = req.session;

    var url = require("url");
    var params = url.parse(req.url, true).query;
    var action = params.action;

    //if(!sess.username && !params.action) { // not logged in
    //    res.render("reservation/newReservation.html");
    //} else if(!sess.username){

        var name = params.name;
        var contact_no = params.contact_no;
        var activity = params.activity;
        var guest_type = params.guest_type;
        var category = params.category;
        var arrival = params.arrival;
        var departure = params.departure;
        var no_persons = params.no_persons;
        var facility = params.facility
        var room = params.room;
        var remarks=params.remarks;
        var post = {name, contact_no, activity,guest_type, category, arrival,departure,no_persons, remarks};

        submitToDB(post, currentDB, "reservations");

        res.render("confirmation.html");
    //} else if(sess.username){
    //   res.redirect("/home");
    //}

});

app.get('/newGuest',function(req,res){
    sess = req.session;

    var url = require("url");
    var params = url.parse(req.url, true).query;
    var action = params.action;
	
	
    //if(!sess.username && !params.action) { // not logged in
    //    res.render("guest/newGuest.html");
    //} else if(!sess.username){
	
		var reg_no = params.reg_no;
        var name = params.name;
        var res_tel_no = params.res_tel_no;
        var address = params.address;
        var office_tel_no = params.office_tel_no;
        var arrival_date = params.arrival_date;
        var departure_date = params.departure_date;
        var no_persons = params.no_persons;
		var adults = params.adults;
		var children = params.children;
		var emergency_person= params.emergency_person;
		var emergency_no= params.emergency_no;
		var client_type = params. client_type;
        var id_number=params.id_number;
        var post = {reg_no,name, res_tel_no, address,office_tel_no, arrival_date,departure_date,no_persons,adults,children,emergency_person, emergency_no, client_type, id_number}

        submitToDB(post, currentDB, "registration");

        res.render("registerGuest.html");
    //} else if(sess.username){
    //   res.redirect("/home");
    //}

});


app.get('/availablehalls', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

    var que = `select conference_halls.id, conference_halls.name from conference_halls WHERE
                conference_halls.id not in(SELECT conference_halls.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join conference_halls on conference_halls.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or /*within*/
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or /*enclosing*/
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or /*arrival within*/
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) /*departure within*/
                      )
                and fac_type = "conference_halls") order by id asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {
                if(rows.length != 0) {
                   for(i = 0; i < rows.length; i++){
                        res.write(rows[i].name+"");
                   }                    
                } else {
                    res.write(`No halls are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});




app.get('/reservehall', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

   // console.log(arriv + "" + dep);

    var que = `select conference_halls.id, conference_halls.name from conference_halls WHERE
                conference_halls.id not in(SELECT conference_halls.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join conference_halls on conference_halls.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or /*within*/
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or /*enclosing*/
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or /*arrival within*/
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) /*departure within*/
                      )
                and fac_type = "conference_halls") order by id asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {           
                if(rows.length != 0) {
                   res.write(rows.length + " halls are available during the schedule you provided.");
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4"><select style="width: 300px;" id="hall" class="form-control">`);
                   res.write(`<option value="def">Select a Hall</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">`+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);

                    res.write(`<div class="col-md-2"><button type="button" onclick="HallList.add()" class="btn btn-info btn-fill pull-left">Add</button></div>
                    </form></div></div>`);
                    
                } else {
                    res.write(`No halls are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});

app.get('/reservecottage', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

    var que = `select cottages_guesthouses.id, cottages_guesthouses.name from cottages_guesthouses WHERE
                cottages_guesthouses.id not in(SELECT cottages_guesthouses.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join cottages_guesthouses on cottages_guesthouses.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or 
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or 
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or 
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) 
                      )                     
                and fac_type = "cottages_guesthouses")
                and type = "cottage"
                order by name asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {
                if(rows.length != 0) {
                   res.write(rows.length + " cottages are available during the schedule you provided.");                            
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4">
                              <select style="width: 300px;" id="cottage" class="form-control">`);
                   res.write(`<option value="def">Select a Cottage</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">Cottage `+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);
                    res.write(`<div class="col-md-2"><button type="button" onclick="CottageList.add()" class="btn btn-info btn-fill pull-left">Add</button></div>
                    </form></div></div>`);
                    
                } else {
                    res.write(`No cottages are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});


app.get('/reserveguesthouse', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;
    var que = `select cottages_guesthouses.id, cottages_guesthouses.name from cottages_guesthouses WHERE
                cottages_guesthouses.id not in(SELECT cottages_guesthouses.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join cottages_guesthouses on cottages_guesthouses.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or 
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or 
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or 
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) 
                      )                     
                and fac_type = "cottages_guesthouses")
                and type = "guesthouse"
                order by name asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {
                if(rows.length != 0) {
                   res.write(rows.length + " guesthouses are available during the schedule you provided.");                            
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4">
                              <select style="width: 300px;" id="guesthouse" class="form-control">`);
                   res.write(`<option value="def">Select a Guesthouse</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">Guesthouse `+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);
                    res.write(`<div class="col-md-2">
                        <button type="button" onclick="GuestHouseList.add()" class="btn btn-info btn-fill pull-left">Add</button></div>
                    </form></div></div>`);
                    
                } else {
                    res.write(`No guesthouses are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});


app.get('/reservedormitory', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

    //console.log(arriv + "" + dep);

    var que = `select dormitories.id, dormitories.name from dormitories WHERE
                dormitories.id not in(SELECT dormitories.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join dormitories on dormitories.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or 
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or 
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or 
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) 
                      )                     
                and fac_type = "dormitories")
                order by name asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {
                if(rows.length != 0) {
                   res.write(rows.length + " dormitories are available during the schedule you provided.");                            
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4">
                              <select style="width: 300px;" id="dormitory" class="form-control">`);
                   res.write(`<option value="def">Select a Dormitory</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">Dormitory `+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);
                    res.write(` <div class="col-md-2">
                        <button type="button" onclick="DormitoryList.add()" class="btn btn-info btn-fill pull-left">Add</button></div></form></div></div>`);
                    
                } else {
                    res.write(`No guesthouses are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});


app.get('/reservedining', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

    //console.log(arriv + "" + dep);

    var que = `select dining_kitchen.id, dining_kitchen.name from dining_kitchen WHERE
                dining_kitchen.id not in(SELECT dining_kitchen.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join dining_kitchen on dining_kitchen.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or 
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or 
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or 
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) 
                      )                     
                and fac_type = "dining_kitchen"
                )
                order by name asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {
                if(rows.length != 0) {
                   res.write(rows.length + " facilities are available during the schedule you provided.");                            
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4">
                              <select style="width: 300px;" id="dining_kitchen" class="form-control">`);
                   res.write(`<option value="def">Select an Item</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">`+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);
                    res.write(`<div class="col-md-2">
                        <button type="button" onclick="DiningsList.add()" class="btn btn-info btn-fill pull-left">Add</button></div></form></div></div>`);
                    
                } else {
                    res.write(`No rentable facilities are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});

app.get('/reserverentables', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;

    var que = `select other_services.id, other_services.name from other_services WHERE
                other_services.id not in(SELECT other_services.id FROM reservations
                inner join facilities_used on facilities_used.reservation_id = reservations.id
                inner join other_services on other_services.id = facilities_used.fac_id
                where (
                        ('`+arriv+`' >= arrival and '`+dep+`' <= departure) or 
                        ('`+arriv+`' <= arrival and '`+dep+`' >= departure) or 
                        ('`+arriv+`' >= arrival and '`+arriv+`' <= departure) or 
                        ('`+dep+`' >= arrival and '`+dep+`' <= departure) 
                      )                     
                and fac_type = "other_services"
                )
                and reservable = "yes"
                order by name asc`;
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });
    connection.connect();
    connection.query(que, function(err, rows, fields) {                         
                if(rows.length != 0) {
                   res.write(rows.length + " rentable facilities are available during the schedule you provided.");   
                   res.write(`<div class="content"><div class="row"><form><div class="col-md-4"><form>
                              <select style="width: 300px;" id="rentable" class="form-control">`);
                   res.write(`<option value="def">Select an Item</option>`);
                   for(i = 0; i < rows.length; i++){

                        res.write(`<option value="`+rows[i].id+`">`+rows[i].name+`</option>`);
                    }
                    res.write(`</select></div>`);
                    res.write(`<div clas="col-md-3">
                        <button type="button" onclick="RentableList.add()" class="btn btn-info btn-fill pull-left">Add</button></div></form></div></div>`);
                    
                } else {
                    res.write(`No rentable facilities are available during this period of time.`);
                }
           res.end();
        });
    connection.end();
});

app.get('/allreserves', function(req, res) {
    var url = require("url");
    var params = url.parse(req.url, true).query;
    var arriv = params.arrival;
    var dep = params.departure;
    

    if(arriv == undefined || dep == undefined) {
        res.writeHead(200, {
        "Content-Type": "text/html"
        });
        res.write("<h5>Please provide an arrival and departure date.</h5>");
        res.end();
    }

    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.write(`
        <script src="facility_reservation.js"></script>
    `);
    res.write(`
       <link href="assets/css/bootstrap.min.css" rel="stylesheet" />

       <link href='assets/fonts/Roboto.ttf' rel='stylesheet' type='text/css'>
        <script src="assets/js/jquery-1.10.2.js" type="text/javascript"></script>
        <script src="assets/js/bootstrap.min.js" type="text/javascript"></script>
        <script type="text/javascript">
            var _arrival = "`+arriv+`";
            var _departure = "`+dep+`";
        </script>
           <h2 class="title">Facilities for Reservation</h2>
            <p>Note: Facilities that appear here are the only ones that are available during the provided period of time.</p>
        <h2>`+arriv+` until `+dep+`</h2>
       
        <ul class="nav nav-tabs">
          <li class="active"><a data-toggle="tab" href="#tab1">Conference Halls</a></li>
          <li><a data-toggle="tab" href="#tab2">Cottages</a></li>
          <li><a data-toggle="tab" href="#tab3">GuestHouses</a></li>
          <li><a data-toggle="tab" href="#tab4">Dormitories</a></li>
          <li><a data-toggle="tab" href="#tab5">Dining Area and Kitchen</a></li>
          <li><a data-toggle="tab" href="#tab6">Rentables</a></li>
        </ul>
        <div class="tab-content">
          <div id="tab1" class="tab-pane fade in active">
                <h4>Conference Halls</h4>
                <div id="halls_wrap"> </div>
          </div>
          <div id="tab2" class="tab-pane fade">
                <h4>Cottages</h4>
                <div id="cottages_wrap"> </div>
          </div>
          <div id="tab3" class="tab-pane fade">
                <h4>Guesthouses</h4>
                 <div id="guesthouses_wrap"></div>
          </div>
          <div id="tab4" class="tab-pane fade">
                <h4>Dormitories</h4>
                <div id="dormitories_wrap"> </div>
          </div>
          <div id="tab5" class="tab-pane fade">
                <h4>Dining Area and Kitchen</h4>
                <div id="dinings_wrap"> </div>
          </div>
          <div id="tab6" class="tab-pane fade">
                <h4>Other Rentables</h4>
                <div id="rentables_wrap"> </div>
          </div>

        </div>

       
		<div class="content">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-10">
                        <div class="card">
        <table id="facilities_wrap" class="table table-hover table-striped">
        <thead>
            <tr>
                <td>Type</td>
                <td>Name</td>
                <td>Remove</td>
            </tr>
        </thead>
        <tbody id="facilities">

        </tbody>
        </table>
</div></div></div></div></div>
        <script type="text/javascript">
        $(document).ready(function() {

            $.get("/reservehall?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#halls_wrap").html(data); }
            });

            $.get("/reservecottage?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#cottages_wrap").html(data); }
            });

            $.get("/reserveguesthouse?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#guesthouses_wrap").html(data); }
            });

            $.get("/reservedormitory?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#dormitories_wrap").html(data); }
            });

            $.get("/reservedining?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#dinings_wrap").html(data); }
            });

            $.get("/reserverentables?arrival="+_arrival+"&departure="+_departure,{},function(data){
              if(data)  { $("#rentables_wrap").html(data); }
            });

        });
        </script>
    `);
    res.end();
});


app.get('/checkavailable', function(req, res) {
    res.render("availability.html");
});



//viewresdetails
app.get('/viewdetails', function(req, res) {
    var connection = mysql.createConnection({
        host: currentHost, user: dbuser,
        password: dbpass,
        database: currentDB,
    });


    var url = require("url");
    var params = url.parse(req.url, true).query;
    var id = params.id;
    //`+rows[i].name+`
    // <td>`+new String(rows[i].departure).slice(0, 15)+`</td>

    connection.connect();
    connection.query(`select * from reservations 
        where id = `+id, function(err, rows, fields) {
            var item = 0;
                if(rows.length != 0) {
res.write(`


<!doctype html>
<html lang="en">

<head>
   <meta charset="utf-8" />
   <link rel="icon" type="image/png" href="assets/img/logo.png">

   <title>Baguio Teacher's Camp</title>

   <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' name='viewport' />
   <meta name="viewport" content="width=device-width" />
   <link href="assets/css/bootstrap.min.css" rel="stylesheet" />
   <link href="assets/css/animate.min.css" rel="stylesheet" />
   <link href="assets/css/light-bootstrap-dashboard.css" rel="stylesheet" />
   <link href='assets/fonts/Roboto.ttf' rel='stylesheet' type='text/css'>
   <link href="assets/css/pe-icon-7-stroke.css" rel="stylesheet" />

</head>

<body>

  <div class="wrapper">
      <div class="sidebar" data-color="green" ; data-image="assets/img/sidebar-5.jpg">

         <div class="sidebar-wrapper">
            <div class="logo">
               <a href="dashboard.html" class="simple-text">
                    Baguio Teacher's Camp
                </a>
            </div>

            <ul class="nav">
               <li class="">
                  <a href="dashboard.html">
                     <i class="pe-7s-graph"></i>
                     <p>Dashboard</p>
                  </a>
               </li>
                <li>
                  <a href="availability.html">
                     <i class="pe-7s-bookmarks"></i>
                     <p>Available Facilities</p>
                  </a>
               </li>
               <li>
                  <a href="newGuest.html">
                     <i class="pe-7s-user"></i>
                     <p>New Guest</p>
                  </a>
               </li>
               <li>
                  <a href="newReservation.html">
                     <i class="pe-7s-news-paper"></i>
                     <p>New Reservation</p>
                  </a>
               </li>
               <li>
                  <a href="reviewReg.html">
                     <i class="pe-7s-note"></i>
                     <p>Review Registrations</p>
                  </a>
               </li>
               <li>
                  <a href="reservation.html">
                     <i class="pe-7s-date"></i>
                     <p>Reservation List</p>
                  </a>
               </li>
               <li>
                  <a href="guestRecords.html">
                     <i class="pe-7s-note2"></i>
                     <p>Guests' Record</p>
                  </a>
               </li>
               <li>
                  <a href="index.html">
                     <i class="pe-7s-close"></i>
                     <p>Log Out</p>
                  </a>
               </li>
            </ul>
         </div>
      </div>
      <div class="main-panel">
         <nav class="navbar navbar-default navbar-fixed">
            <div class="container-fluid">
               <div class="navbar-header">
                  <a class="navbar-brand" href="#">New Reservation</a>
               </div>
               <div class="collapse navbar-collapse">
                  <ul class="nav navbar-nav navbar-left">

                     <li class="separator hidden-lg hidden-md"></li>
                  </ul>
               </div>
            </div>
         </nav>


         <div class="content">
            <div class="container-fluid">
               <div class="row">
                  <div class="col-md-12">
                     <div class="card">
                        <div class="header">
                           <h4 class="title">Reservation Details</h4>
                        </div>
                        <div class="content">
                                          <table class="table table-user-information">
                                             <tbody id="viewResDetails">
`);


                                            res.write(`
                                    <tr>
                                                   <td>Name:</td>
                                                   <td>`+rows[0].name+`</td>
                                                </tr>
                                                <tr>
                                                   <td>Contact No:</td>
                                                   <td>`+rows[0].contact_no1+`</td>
                                                </tr>
                                                <tr>
                                                   <td>Alt Contact No:</td>
                                                   <td>`+rows[0].contact_no2+`</td>
                                                </tr>
                                                <tr>
                                                   <td>Status:</td>
                                                   <td>`+rows[0].status+`</td>
                                                </tr>
                                                <tr>
                                                   <td>Activity/Purpose</td>
                                                   <td>`+rows[0].activity+`</td>
                                                </tr>

                                                   <tr>
                                                      <td>Guest Type</td>
                                                      <td>`+rows[0].guest_type+`</td>
                                                   </tr>

                                                   <tr>
                                                      <td>Category</td>
                                                      <td>`+rows[0].category+`</td>
                                                   </tr>
                                                   
                                                   <tr>
                                                      <td>Arrival Date</td>
                                                      <td>`+new String(rows[0].arrival).slice(0, 15)+`</td>
                                                   </tr>
                                                    <tr>
                                                      <td>Departure Date</td>
                                                      <td>`+new String(rows[0].departure).slice(0, 15)+`</td>
                                                   </tr>
                                                    <tr>
                                                      <td>Remarks</td>
                                                      <td></td>
                                                   </tr>
                            `);
                          }

										res.write(`
                                             </tbody>
                                          </table>
                     
                        <div class="row">
                        <hr>
                     <div class="col-sm-9">
                              
                     </div>
                     <div class="col-md-1">
                             
                      <a button="" type="submit" class="btn btn-info btn-md btn-fill" href="/editDetails?id=`+rows[0].id+`">Edit</a>
                              
                     </div>
                           <div class="col-sm-2">
                              <a button="" type="submit" class="btn btn-info btn-md btn-fill pull-left" href="/confirmed?">Confirm</a>
                              
                     </div>
                     </div>
                          </div>
                        </div>
                     </div>
                 
              
               </div>
            </div>
         </div>

      </div>
   </div>


</body>
<!--   Core JS Files   -->
<script src="assets/js/jquery-1.10.2.js" type="text/javascript"></script>
<script src="assets/js/bootstrap.min.js" type="text/javascript"></script>
<!--  Checkbox, Radio & Switch Plugins -->
<script src="assets/js/bootstrap-checkbox-radio-switch.js"></script>
<!--  Charts Plugin -->
<script src="assets/js/chartist.min.js"></script>
<!--  Notifications Plugin    -->
<script src="assets/js/bootstrap-notify.js"></script>
<!-- Light Bootstrap Table Core javascript and methods-->
<script src="assets/js/light-bootstrap-dashboard.js"></script>
    



</html>
`);



           res.end();
        });
    connection.end();
});