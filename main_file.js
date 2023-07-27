

//this is the node js module, we are writing our application using this module
var exp = require("express")
var mysql = require("mysql")
var localstorage = require("localStorage")
var http_msg = require("http-msgs")
var body_parser = require("body-parser")
var bcrypt = require('bcrypt');
var saltrounds = 10
var messagebird=require("messagebird")



//creating the app
var app = exp()
app.use(exp.static(__dirname + '/views'));
app.use(body_parser.urlencoded({ extended: false }))
app.set("view engine", "ejs");


var list = { host: "127.0.0.1", user: "root", password: "", database: "best_solutions", multipleStatements: true }
var db = mysql.createConnection(list)
db.connect(function (err) {
    if (err)
        throw err
    else
        console.log("connection established")
})


//this is ourr first page
app.get("/", function (req, res) {


   //on our first page we display some doctor name,some disease name
   //some product_name ,so we are fetching these details from our database
   //in which we have table doctor_data,product_data,disease_data
    db.query("select * from doctor_data ;select * from disease_data;select * from product_data;", function (err, result) {
        if(err)
        {
            throw err;

        }
        else
        {
        //result1 is doctor_data
        //result2 is product_data
        //result_disease is disease_data
        var result1 = result[0];
        var result2 = result[2];
        var result_disease = result[1];
        

        //now we call a function and pass the entire data to it
        call_function(result1, result2, result_disease)
    }
        
    })
      //here is the function  call_function

      //now one thing you need to look here is,
      //in our database we have given a specific 5 digit id to a doctor ,product and disease
      //every doctor has an image ,every product has an image
      //the name of that image is id+.jpg
      //so here we are adding jpg to id's ,so that we can get the name
      //of image and display it on the ejs page
    function call_function(result1, result2, result_disease) {
        for (i = 0; i < result1.length; i++)
            result1[i].doctor_id = result1[i].doctor_id + ".jpg";
        for (i = 0; i < result2.length; i++)
            result2[i].product_id = result2[i].product_id + ".jpg";

            //now we are rendering the ejs page where we have displayed all the information
        res.render(__dirname + "/views/" + "user_page.ejs", { result_disease: result_disease, result1: result1, result2: result2 })
    }

}).listen(8080)

//this is for user login 
app.post("/login", function (req, res) {
    //user enters his email and password
    //the password is stored in encrypted format so we need to check the passwords
    //separately
    //firsty we read the  email that user has input
    val1 = req.body.email;
    //now we store this email to our server side localstorage for future use
    localstorage.setItem("email", val1);
    
   //now we read the password input by user
    var val2 = req.body.password;

    //now firstly we check whether the email exist in our database
    db.query("select * from user_data where email=?", [val1], function (err, result_user) {
        if (err) {
            throw err;
        }
        else
        {
        db.query("select * from doctor_data ;select * from disease_data;select * from product_data;", function (err, result) {
            
            if (err) {
                throw err;
            }
            else
            {

           //here we are fectching the doctor details,product details,disease details
            var result1 = result[0];
            var result2 = result[2];
            var result_disease = result[1];
            console.log(result[0])
            console.log(result[1])
            console.log(result[2])

            //now we call the function where we will render the ejs page
            call_function(result1, result2, result_disease)
            }
            
        })
    }

        //checking whether the entered password matchs with the decryption of stored password
        //this will give a boolean output
        function decrypt_password(hash_password, password) {
            console.log("here in password decryption");
            var f = bcrypt.compare(password, hash_password).then(function (result) {
                
                
                return result;//this result will be boolean
            });
            return f;

        }
        function call_function(result1, result2, result_disease) {

            //here we are adding jpg to image id ,so that we can access the images from
            //datastore
            for (i = 0; i < result1.length; i++)
                result1[i].doctor_id = result1[i].doctor_id + ".jpg";
            for (i = 0; i < result2.length; i++)
                result2[i].product_id = result2[i].product_id + ".jpg";

                //now to know whether a use exist,we need to check there should be one user 
                //with the given email and then we find the hashed password from database
                //we match the hashed password with user input password
            if (result_user.length > 0 && decrypt_password(result_user[0].password, val2)) {
                
                //this means the user exist with those credentials
                //now we store his user name,user id,email to server side
                //local storage 
                var name = result_user[0].user_name;
                localstorage.setItem("user_name", result_user[0].user_name);
                localstorage.setItem("user_id", result_user[0].user_id);
                localstorage.setItem("email", result_user[0].email);
                res.render(__dirname + "/views/" + "user_page2.ejs", { name: name, result_disease: result_disease, result1: result1, result2: result2 })
            }
             //if user does not exist we statys on the same page
            else
            {
                res.render(__dirname + "/views/" + "user_page.ejs", { result_disease: result_disease, result1: result1, result2: result2 });
            }
        }
    })

})


//this page is for signup page
app.get("/signup", function (req, res) {
    console.log("signup here")
    res.render(__dirname + "/views/" + "signup.ejs")
})


//verifying the user at the time of signup
app.post("/verification", function (req, res) {
    //getting all the details of user from the form he filled for signup
    first_name = req.body.first_name
    last_name = req.body.last_name
    user_name = req.body.user_name
    password = req.body.password
    repassword = req.body.repassword
    email = req.body.email
    phone = req.body.phone_number
    

    //we will send this 4 digit code on user email,so that we can verify
    // this is a global variable will be use in multiple end points
    random = Math.floor(1000 + Math.random() * 9000);
    
    
    
    //this is to send the mails
    var nodemailer = require("nodemailer")
    db.query("select * from user_data where user_name=? or email=?", [user_name, email], function (err, result) {
        
        //if user already exist
        if (result.length > 0)
            res.send("username or email already exist")
        else {
            // it is a new user ,we will send mail on his mail
            var list = { service: "gmail", auth: { user: "chirayumaheshwari5@gmail.com", pass: "Mockinggrid1234@" } }
            var transporter = nodemailer.createTransport(list)
            var list2 = { from: "chirayumaheshwari5@gmail.com", to: email, subject: "this is verification mail", text: "this is the code " + random }
            //setup to send emails
            transporter.sendMail(list2, function (err, info) {
                if (err)
                    throw err
                else{
                    //now we will take the code that user has got on his mail
                res.render(__dirname + "/views/" + "input_code.ejs")
                }
            })
        }
    }
    )

})
//now verifying the input code
app.post("/registration", function (req, res) {
    //creating the code
    entered1 = parseInt(req.body.codeBox1)
    entered2 = parseInt(req.body.codeBox2)
    entered3 = parseInt(req.body.codeBox3)
    entered4 = parseInt(req.body.codeBox4)
    entered = entered1 * 1000 + entered2 * 100 + entered3 * 10 + entered4;
    
    //validating the code sent on mail in sign up process
      //code matches ,so now we will create the account
    if (entered == random) {                
                    
                    var sql = "insert into user_data (first_name,last_name,email,phone,password,user_id,user_name) values(?,?,?,?,?,?,?)"

                    console.log("creating _password")
                    //now we are encrypting user password
                    bcrypt.genSalt(saltrounds, function (err, salt) {
                        bcrypt.hash(password, salt, function (err, hash1) {
                            console.log(hash1);
                            store_data(hash1);//calling the function to store data


                        });

                    });




                    function store_data(hash_password) {
                        db.query(sql, [first_name, last_name, email, phone, hash_password, random = Math.floor(1000 + Math.random() * 9000), user_name], function (err, result) {
                            if (err)
                                throw err
                            else {
                                //this is the data that we will display over page
                                db.query("select * from doctor_data ;select * from disease_data;select * from product_data;", function (err, result) {
                                    //result1 is doctor data
                                    //result2 is product data
                                    //result_disease is information about disease
                                    var result1 = result[0];
                                    var result2 = result[2];
                                    var result_disease = result[1];
                                    
                                    call_function(result1, result2, result_disease)
                                    if (err) {
                                        throw err;
                                    }
                                })

                                function call_function(result1, result2, result_disease) {
                                    //ading jpg for the images
                                    for (i = 0; i < result1.length; i++)
                                        result1[i].doctor_id = result1[i].doctor_id + ".jpg";
                                    for (i = 0; i < result2.length; i++)
                                        result2[i].product_id = result2[i].product_id + ".jpg";
                                    res.render(__dirname + "/views/" + "user_page3.ejs", { name: user_name, result_disease: result_disease, result1: result1, result2: result2 })
                                }


                            }

                        })
                    }
                
            }
        
    
    else
        res.send("code doesn't match");
})



//if a user want too reset the password
app.get("/reset_password", function (req, res) {


    res.render(__dirname + "/views/" + "reset_password.ejs");
    //setting up new password
})


app.post("/change_your_password", function (req, res) {
    email2 = req.body.email

    //this code will be sent on mail to verify the user
    random2 = Math.floor(10000 + Math.random() * 90000);
    db.query("select * from user_data where email=?;", [email2], function (err, result) {
        if (Object.keys(result).length == 0) {
            res.send("user doesn't exist with this email id")
        }
        else {
            //now if that email exist in our database,we will send a 5 digit code to his mail
            var nodemailer1 = require("nodemailer")
            var list1 = { service: "gmail", auth: { user: "chirayumaheshwari5@gmail.com", pass: "Mockinggrid1234@" } }
            var transporter1 = nodemailer1.createTransport(list1)
            var list3 = { from: "chirayumaheshwari5@gmail.com", to: email2, subject: "this is verification mail", text: "this is the code" + random2 }
            transporter1.sendMail(list3, function (err, info) {
                if (err)
                    throw err
                console.log(info.response)

            })
            //now user will allowed to change his password
            res.render(__dirname + "/views/change_your_password.ejs");
        }

    })

})


//verifying the code ,entered by user at the time of resetting password
app.post("/status", function (req, res) {




    random_int = req.body.code;
    console.log(random_int)
    console.log(random2)
    var password_status = req.body.password;
    var repassword_status = req.body.repassword;
    if (random_int != random2)
        res.send("code doesn't match")
    else if (password_status != repassword_status)
        res.send("password doesn't match")
    else {

        //password encryption is being done
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password_status, salt, function (err, hash) {
                console.log(hash)
                db.query("update user_data set password=? where email=?", [hash, email2], function (err, result) {
                    console.log(result)

                })
            });


        });



        res.send("password changed successfully")
    }
})




//when a user hits consult button to book an appointment
// to book an appointment
//this url will get us an id of doctor so that we can recognize him
app.get("/:id/consult", function (req, res) {


    //we are getting the doctor id from the passed parameter
    var value = req.params.id;
    console.log(value);
    

    //we are fetcing the user id from local  storage
    var user_name = localstorage.getItem(user_name);
    //now we are getting the details for the specific doctor and products and other doctors
    db.query("select * from doctor_data where doctor_id=?;select * from doctor_data;select * from product_data;", [value], function (err, result) {
        result_basic=result[0];//doctor detail with given id
        result1=result[1];//doctor data
        result2=result[2];//product_data
        var i;
                
        //adding jpg to their id
                for (i = 0; i < result1.length; i++) {
                    result1[i].doctor_id = result1[i].doctor_id + ".jpg"
                }
                for (i = 0; i < result2.length; i++) {
                    result2[i].product_id = result2[i].product_id + ".jpg"
                }
                result_basic[0].doctor_id = result_basic[0].doctor_id + ".jpg";
        
                //getting user name so that we can display it on our website
        var user_name = localstorage.getItem("user_name")

        //now rendering the consult.ejs page
        res.render(__dirname + "/views/" + "consult.ejs", { user_name: user_name, result_basic: result_basic, result1: result1, result2: result2 })



    })
});


// when user want to book an appointment(after filling our details)
app.post("/:id/input_data", function (req, res) {
    var id = req.params.id;     //this is id of the doctor for which booking is generate
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var phone = req.body.phone;
    var email = req.body.email;
    var date = req.body.date;
    var slot = req.body.slot;
    var gender = req.body.gender;
    var bdate = req.body.bdate;
    var problem_statement = req.body.problem_statement;
    
    

   //now we are fecting the details of doctor and produtc to display on the page
    db.query("select * from doctor_data;select * from product_data;", function (err, result) {
        result1=result[0];  //doctor data
        result2=result[1];   //product data
        
        if (err) {
            throw err;
        }
        else {
            var i;
             //adding jpg to all the doctor_id and product_id
            for (i = 0; i < result1.length; i++) {
                result1[i].doctor_id = result1[i].doctor_id + ".jpg"
            }
            for (i = 0; i < result2.length; i++) {
                result2[i].product_id = result2[i].product_id + ".jpg"
            }
            //we are getting user name and rendering the data.ejs page
            var user_name = localstorage.getItem("user_name")
        res.render(__dirname + "/views/" + "data.ejs", { user_name: user_name, first_name: first_name, last_name: last_name, email: email, date: date, slot: slot, problem_statement: problem_statement, phone: phone, result1: result1, result2: result2, gender: gender, bdate: bdate })

            

        }

    })

})

//this is the final page of appointment where you have to make payment,you have to make
//your developer will write the code
app.get("/final", function (req, res) {
    

    
    db.query("select * from doctor_data;select * from product_data", function (err, result) {
        
        result1=result[0]  //doctor data
        result2=result[1]  //product data
        if (err) {
            throw err;
        }
        else {
            var i;
          //adding jpg to all the pages
            for (i = 0; i < result1.length; i++) {
                result1[i].doctor_id = result1[i].doctor_id + ".jpg"
            }
            for (i = 0; i < result2.length; i++) {
                result2[i].product_id = result2[i].product_id + ".jpg"
            }
            //rendering the user to final.ejs page
            res.render(__dirname + "/views/" + "final.ejs", { result1: result1, result2: result2 })

        }

    })


    
})



//this page is for the disease,the id in the parameter is for the disease
app.get("/:id/disease", function (req, res) {
    

    //getting the id of the disease from the url
    var id = req.params.id;

    
    var user_name = localstorage.getItem("user_name");
    db.query("select * from product_data where disease_id=?;", [id], function (err, result) {
        var result2 = result
        console.log(result)
        for (var i = 0; i < result2.length; i++)
            result2[i].product_id = result2[i].product_id + ".jpg";
    //on this page we are passing user_name disease id and products;
        res.render(__dirname + "/views/" + "disease.ejs", { user_name: user_name, id: id, result2: result2 })
    })
})



//displaying the details of doctors registered for a particualr disease
app.get("/:id/specialist", function (req, res) {
    var id = req.params.id;
    console.log(id);
    db.query("select * from doctor_data where disease_id=?;select * from disease_data where disease_id=?", [id, id], function (err, result) {

        var result2 = result[1];  
        console.log(result2);
        do_call(result, result2);
    })
    function do_call(result, result2) {
        console.log(result[0]);
        for (var i = 0; i < result[0].length; i++) {
            result[0][i].doctor_id = result[0][i].doctor_id + ".jpg";
        }
        console.log(result);
        res.render(__dirname + '/views/' + 'pd.ejs', { result1: result[0], disease_id: result2[0].disease_type })
    }
})






//when a user wants to write something,query
app.get("/write_to_us", function (req, res) {
    //we get the name 
   
    var user_name = localstorage.getItem("user_name");

   
        res.render(__dirname + "/views/" + "write_to_us.ejs", { name: user_name })

    })


//storing the user question and displaying the thank you page
app.post("/thank_you", function (req, res) {

    //this is the question given by user
    var query = req.body.query;
    
    var user_id = localstorage.getItem("user_id")
    
        var question_id = Math.floor(1000 + Math.random() * 9000);
        db.query("insert into user_query (user_id,user_query,question_id) values(?,?,?);", [user_id, query, question_id], function (err, result) {
            res.render(__dirname + "/views/" + "thank_you_page.ejs")
        })
    })



//redirecting the user to blog area
app.get("/blogs", function (req, res) {

    db.query("select * from user_query order by question_id;select * from user_comment order by question_id;", function (err, result) {
        
        res.render(__dirname + "/views/" + "blog.ejs", { result1: result[0], result2: result[1] })
    })
})



//Ajax Call
//when a user  comments on some query
app.post("/push_data", function (req, res) {
    var data = req.body;
    var question_id = data["question_id"];
    var html = data["html"];
    var user_id = localstorage.getItem("user_id");
    var comment_id = Math.floor(1000 + Math.random() * 9000);
    db.query("insert into user_comment (question_id,user_id,comment,likes,dislikes,comment_id,total) values(?,?,?,?,?,?,?);", [question_id, user_id, html, 0, 0, comment_id, 0], function (err, result) {

    })
    
    http_msg.sendJSON(req, res,
        {
            msg: "success"
        })
})


//Ajax call
//when a user wants to see the comment over a question from blog area
app.post("/get_comments", function (req, res) {

    var data = req.body;
    
    var question_id = data["question_id"];
    
    db.query("select * from user_comment where question_id=?;", [question_id], function (err, result) {
        if (err)
            throw err;
        console.log(result[0]);
        
        http_msg.sendJSON(req, res,
            {
                question_id: "h"
            })

    })

})
//Ajax call
//when a user addes a product to the cart
app.post("/update_count", function (req, res) {

    var body = req.body;
    var value = body["value"];
    var comment_id = body["comment_id"]
    console.log("in update count")
    console.log(comment_id);
    db.query("update user_comment set total=? where comment_id=?;", [value, comment_id], function (err, result) {
        if (err)
            throw err;
    })
    http_msg.sendJSON(req, res, { msg: "done" })
})


//Ajax call
//updating the count of a particualr product from user cart
app.post("/add_to_cart", function (req, res) {

    var body = req.body;
    var count = body["count"]
    var product_id = body["id"]
    var user_id = localstorage.getItem("user_id")
    console.log(count, product_id, user_id);
    db.query("select * from user_cart where user_id=? and product_id=?", [user_id, product_id], function (err, result) {
        if (result.length == 0)
            db.query("insert into user_cart (count,product_id,user_id) values(?,?,?);", [count, product_id, user_id], function (err, result) {
                if (err)
                    throw err

            })
        else {
            var total_products = parseInt(count);
            if (total_products == 0)
                db.query("delete from user_cart where user_id=? and product_id =?", [user_id, product_id], function (err, result) { })
            db.query("update user_cart set count=? where user_id=? and product_id=?;", [total_products, user_id, product_id], function (err, result) {
                if (err)
                    throw err
            })
        }
    })

})


//checking out the user profile
app.get("/user_profile", function (req, res) {
    var name = localstorage.getItem("user_name")
    res.render(__dirname + "\\views\\" + "user_profile.ejs", { name: name });
})


//checking out the cart
app.get("/your_cart", function (req, res) {
    var user_id = localstorage.getItem("user_id");
    db.query("select * from user_cart natural join product_data where user_id=?", [user_id], function (err, result) {
        var name = localstorage.getItem("user_name");
        res.render(__dirname + "/views/" + "cart.ejs", { name: name, result: result });
    })
})



//Ajax call
//to get more information about disease
app.post("/more_info", function (req, res) {
    var data = req.body;
    var disease = data["disease"]
    var textarea = data["textarea"]
    var email = data["email"]
    console.log(disease)
    console.log(textarea)
    console.log(email)
    http_msg.sendJSON(req, res, {
        msg: "success"
    }

    )
})

//sharing user story
app.get("/:id/write_about", function (req, res) {
    var id = req.params.id;
    res.render(__dirname + "//views//" + "write_about.ejs", { name: localstorage.getItem("user_name") })
})

//displaying thank you page when user share his story
app.post("/:id/thank_you", function (req, res) {
    var user_info = req.body.feedback;
    //we push it to database
    var sql = "insert into user_review (user_id,doctor_id,review) values(?,?,?);"
    db.query(sql, [localstorage.getItem("user_id"), req.params.id, user_info], function (err, result) {
        console.log(result);
        res.render(__dirname + "\\views\\" + "thank_you_page.ejs")
    });

})

//to get the more information of user when he signup
app.post("/more_info_of_user", function (req, res) {
    console.log("we are in more info")
    function sol() {
        var data = req.body;
        
        var sql = "insert into additional_info(email,des) values(?,?);"
        db.query(sql, [data["email"], data["textarea"]], function (req, res) {
            console.log("stored in database");
        })
        send_json()
    }
    function send_json() {
        http_msg.sendJSON(req, res, {
            msg: "success is this"
        })
    }
    sol();
})