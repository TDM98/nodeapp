var express     = require('express');  
var mongoose    = require('mongoose');  
var multer      = require('multer');  
var path        = require('path');  
var csvModel    = require('../models/demoModel');  
var csv         = require('csvtojson');  
var bodyParser  = require('body-parser');
const csve = require('csv-express');
const cors = require('cors');  
const { userInfo } = require('os');
const amqplib = require('amqplib');
var app=express();

//connect to db  
mongoose.connect('mongodb://127.0.0.1:27017/demodb',{useNewUrlParser:true})  
.then(()=>console.log('connected to db'))  
.catch((err)=>console.log(err)) 

// connect to rabbitmq
var channel, connection;
async function connect() {
  try {
      // rabbitmq default port is 5672
    const amqpServer = 'amqp://localhost:5672'
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel()

    // make sure that the order channel is created, if not this statement will create it
    await channel.assertQueue('search')
  } catch (error) {
    console.log(error)
  }
}

//search data
app.get('/find/query', cors(), function(req, res, next) {
    var query = req.params.query;

    csvModel.find({
        'country': /a/
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
    channel.sendToQueue(
        'search',
        Buffer.from(
          JSON.stringify({
            query
          }),
        ),
      )
});
connect().then(() =>{
  try {
channel.consume('search', (query) => {
  console.log("consumed")
  channel.ack(query);
})
} catch (error) {
console.log(error)
}
})

 //service port
 var port = process.env.PORT || 9005;  
app.listen(port,()=>console.log('server run at port '+port)); 
module.exports=app;