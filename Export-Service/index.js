var express     = require('express');  
var mongoose    = require('mongoose');  
var multer      = require('multer');  
var csvModel    = require('../models/demoModel');  
var csv         = require('csv-express');  
const cors = require('cors');  
const { userInfo } = require('os');
const amqplib = require('amqplib');
var app=express();
//connect to db  
mongoose.connect('mongodb://127.0.0.1:27017/demodb',{useNewUrlParser:true})  
.then(()=>console.log('connected to db'))  
.catch((err)=>console.log(err))
//connect to rabbitmq
var channel, connection;
async function connect() {
  try {
      // rabbitmq default port is 5672
    const amqpServer = 'amqp://localhost:5672'
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel()
    
    //channel
    await channel.assertQueue('export')
  } catch (error) {
    console.log(error)
  }
}
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
    channel.sendtoQueue(
      'export',
      Buffer.from(
          JSON.stringify({
              csv
          }),
      ),
  )
  });

  connect().then(() =>{
    try {
channel.consume('export', (csv) => {
    console.log("consumed")
    channel.ack(csv);
  })
} catch (error) {
  console.log(error)
}
})

 //service port
 var port = process.env.PORT || 9005;  
app.listen(port,()=>console.log('server run at port '+port)); 
module.exports=app;