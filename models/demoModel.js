var mongoose  =  require('mongoose');  
   
var csvSchema = new mongoose.Schema({  
    Index:{  
        type:String
    },  
    Country:{  
        type:String  
    },  
    Name:{  
        type:String
    },  
    Website:{  
        type:String
    },
    Description:{  
        type:String
    },
    Founded:{  
        type:String
    },
    Industry:{  
        type:String
    },
});  
   
module.exports = mongoose.model('demoModel',csvSchema); 
csvSchema.index({fields: 'text'});