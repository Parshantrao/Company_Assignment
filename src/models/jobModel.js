const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId


const jobSchema = new mongoose.Schema({
    title:{type:String,required:true,lowercase:true,trim:true},
    userId:{type:objectId,ref:"User"},
    description:{type:String,required:true,lowercase:true,trim:true},
    email:{type:String,lowercase:true,trim:true},
    skills:{type:String,lowercase:true,trim:true},
    experience:{type:Number,default:0},
    isDeleted:{type:Boolean,default:false},
    appliedCandidates:[{
        _id:false,
        candidate:{type:objectId,ref:"User"},
        name:{type:String,lowercase:true,trim:true},
        email:{type:String,lowercase:true,trim:true},
        resume: {type:String},
        coverLetter:{type:String}
    }]
})

module.exports=mongoose.model("Jobs",jobSchema)