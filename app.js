var express     = require('express');  
const busboy = require('connect-busboy');
var mongoose    = require('mongoose');  
var multer      = require('multer');  
var path        = require('path');  
var csvModel    = require('./models/demoModel');  
var csv         = require('csvtojson');  
var bodyParser  = require('body-parser');
const csve = require('csv-express');
const cors = require('cors');  
const { userInfo } = require('os');
const amqplib = require('amqplib');
const fs = require('fs');

var storage = multer.diskStorage({  
destination:(req,file,cb)=>{  
cb(null,'./public/uploads');  
},  
filename:(req,file,cb)=>{  
cb(null,file.originalname);  
}  
});  
var channel,connection;
var uploads = multer({storage:storage}); 
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
var temp ;  

app.use(busboy({
    highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
})); // Insert the busboy middle-ware

const uploadPath = path.join(__dirname, 'public'); // Register the upload path
app.post('/',uploads.single('csv'),(req,res) => {
    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('file', (fieldname, file, filename) => {
        console.log(`Upload of '${filename}' started`);

        // Create a write stream of the new file
        const fstream = fs.createWriteStream(req.file.path);
        // Pipe it trough
        file.pipe(fstream);
        csv()  
        .fromFile(req.file.path)  
        .then((jsonObj)=>{  
        console.log(jsonObj);  
        
        //insertmany is used to save bulk data in database.
        //saving the data in collection(table)
        csvModel.insertMany(jsonObj,(err,data));
        }); 
        // On finish of the upload
        fstream.on('close', () => {
            console.log(`Upload of finished`);
            res.redirect('back');
        });
       
    });

//convert csvfile to jsonArray     

});  


//search
app.get('/find/query', cors(), function(req, res, next) {
    var query = req.params.query;

    csvModel.find({
        'country': /cape/
    })
    .exec() 
    .then(function(result) {
        if (result) {
            res.json(result)
        } else {
            next() 
        }
    })
    .catch(next) 
})


//download data
app.get('/export', function(req, res, next) {
    var filename   = "products.csv";
    var dataArray;
    csvModel.find().lean().exec({}, function(err, data) {
        if (err) res.send(err);
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader("Content-Disposition", 'attachment; filename='+filename);
        res.csv(data, true);
    });
 });


//assign port  
var port = process.env.PORT || 5000;  
app.listen(port,()=>console.log('server run at port '+port)); 
module.exports=app;