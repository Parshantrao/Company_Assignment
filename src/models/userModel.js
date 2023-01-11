const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{type:String,required:true,lowercase:true,trim:true},
    email:{type:String,unique:true,required:true,lowercase:true,trim:true},
    password:{type:String,required:true,trim:true}
})

module.exports=mongoose.model("User",userSchema)