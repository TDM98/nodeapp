var express     = require('express');  
var mongoose    = require('mongoose');  
var multer      = require('multer');  
var path        = require('path');  
var csvModel    = require('../models/demoModel');  
var csv         = require('csvtojson');  
var bodyParser  = require('body-parser');
const fs        = require('fs');
const cors = require('cors');  
const { userInfo } = require('os');
const amqplib = require('amqplib');


// connect to rabbitmq
var channel, connection;
async function connect() {
  try {
      // rabbitmq default port is 5672
    const amqpServer = 'amqp://localhost:5672'
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel()

    // make sure that the order channel is created, if not this statement will create it
    await channel.assertQueue('import')
  } catch (error) {
    console.log(error)
  }
}

var storage = multer.diskStorage({  
    destination:(req,file,cb)=>{  
    cb(null,'../public/uploads');  
    },  
    filename:(req,file,cb)=>{  
    cb(null,file.originalname);  
    }  
    });  
    var uploads = multer({storage:storage});  
    //connect to db  
    mongoose.connect('mongodb://127.0.0.1:27017/demodb',{useNewUrlParser:true})  
    .then(()=>console.log('connected to db'))  
    .catch((err)=>console.log(err))  
    //init app  
    var app = express();  
    //set the template engine  
    app.set('view engine','ejs');  
    //fetch data from the request  
    app.use(bodyParser.urlencoded({extended:false}));  
    //static folder  
    app.use(express.static(path.resolve(__dirname,'public')));  
    //default pageload  
    app.get('/',(req,res)=>{  
    csvModel.find((err,data)=>{  
    if(err){  
    console.log(err);  
    }else{  
    if(data!=''){  
    res.render('index',{data:data});  
    }else{  
    res.render('index',{data:''});  
    }  
    }  
    });  
    });  
  
    app.post('/upload',uploads.single('csv'),(req,res)=>{  
      const stream = fs.createWriteStream(req.file.path);

  stream.on('open', () => req.pipe(stream));
    //convert csvfile to jsonArray     
    csv()  
    .fromFile(req.file.path)  
    .then((jsonObj)=>{  
    console.log(jsonObj);  
    
    //insertmany is used to save bulk data in database.
    //saving the data in collection(table)
    csvModel.insertMany(jsonObj,(err,data)=>{  
    if(err){  
    console.log(err);  
    }else{  
    res.redirect('/');  
    }  
    });
 
})
    })

//service port
var port = process.env.PORT || 9005;  
app.listen(port,()=>console.log('server run at port '+port)); 
module.exports=app;