const {jobModel,userModel}=require('../models')
const validator=require('../utils/validators')
const jwt=require('jsonwebtoken')
var markdown = require("markdown").markdown;
const fs = require('fs-extra');
const multer = require('multer');



// SET STORAGE
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'src/uploads')
    },
    filename:function(req,file,cb){
        let ext=file.originalname.split(".")[1]
        if( file.fieldname == 'coverLetter' &&  file.mimetype == 'text/markdown'){
            cb(null,'coverLetter'+req.token.userId+"."+ext)
        }
        else if( file.fieldname == 'resume' && file.mimetype == 'application/pdf'){
            cb(null,'resume'+req.token.userId+"."+ext)
        }
    }
})


const upload = multer({
    storage:storage,
    fileFilter:function(req,file,callback,res){
        // console.log(file,"file")
        if( file.fieldname == 'coverLetter' &&  file.mimetype == 'text/markdown'){
            callback(null,true)
        }
        else if( file.fieldname == 'resume' && file.mimetype == 'application/pdf'){
            callback(null,true)
        }
        else{
            console.log("only pdf format is accepted")
            callback(null, false)
        }
    },
    limits:1024*1024*8  // 8 mb
}) ;


const userRegister = async function(req,res){
    try{
        let data = req.body
        const {name,email,password}=data

        // Validation 
        if(!validator.isValidObject(data)){
            return res.status(400).send({status:false,message:"pls provide details to register"})
        }
        let mandField=["name","email","password"]
        for(let key of mandField){
            if(!validator.isValid(data[key])){
                return res.status(400).send({status:false, message:`${key} must be present`})
            }
        }
        if(!validator.isValidName(name)){
            return res.status(400).send({status:false,message:"Invalid name(name must contains alphabets only)"})
        }
        if(!validator.isValidEmail(email)){
            return res.status(400).send({status:false,message:"Invalid email"})
        }
        if(!validator.isValidPass(password)){
            return res.status(400).send({status:false,message:"password must contain alphabets, number, special charactors and its length should be between 8-15"})
        }
        // Ends

        // uniqueness of email
        let existedUser = await userModel.findOne({email}) 
        if(existedUser){
            return res.status(400).send({status:false, message:`${email} is already exist`})
        }

        const newUser = await userModel.create(data)
        return res.status(201).send({status:true, message:"Registered Successfully", data:newUser})

    }
    catch(err){
        return res.status(500).send({status:false, message:err})
    }
}


const login = async function(req,res){
    try{
        let data=req.body
        const {email,password}=data

        if(!validator.isValidObject(data)){
            return res.status(400).send({status:false, message:"Pls provide credentials to login"})
        }
        let mandField = ["email","password"]
        for(let key of mandField){
            if(!validator.isValid(data[key])){
                return res.status(400).send({status:false, message:`${key} must be present`})
            }
        }
        if(!validator.isValidEmail(email)){
            return res.status(400).send({status:false, message:"Invalid Email"})
        }

        const user = await userModel.findOne({email})
        if(!user) {
            return res.status(404).send({status:false, message:"email not registered"})
        }
        else if(user.password!=password){
            return res.status(404).send({status:false, message:"password is incorrect"})
        }

        let token = jwt.sign(
            {
                userEmail:email,
                userId:user._id
            },
            "SecretKeY",
            {expiresIn:"1h"}
        )

        return res.status(201).send({status:true,message:"loged in successfuly",data:{token:token}})

    }
    catch(err){
        return res.status(500).send({status:false, message:err})
    }
}


const createJob = async function(req,res){
    try{
        let data=req.body
        let {title,description,email,skills,experience}=data
        
        if(!validator.isValidObject(data)){
            return res.status(400).send({stauts:false, message:"pls provide job detatils"})
        }
        let mandField=["title","description","skills"]
        for(let key of mandField){
            if(!validator.isValid(data[key])){
                return res.status(400).send({status:false, message:`${key} must be present`})
            }
        }
       
        // validations
        if(!validator.isValidAlphaNum(title)){
            return res.status(400).send({status:false, message:"title can only contains numbers, alphabets and - , _ , ."})
        }   
        
        if(!validator.isValidAlphaNum(description)){
            return res.status(400).send({status:false, message:"description can only contains numbers, alphabets and - / _ / . / , "})
        }   
       
        if(!validator.isValidAlphaNum(skills)){
            return res.status(400).send({status:false, message:"skills can only contains numbers, alphabets and - / _ / . / , "})
        }  
        
        if(experience || experience==""){
            if(!experience.trim() || !validator.isValidNumber(experience)) return res.status(400).send({status:false, message:"experience should be valid no. of year"})
            experience=Number(experience)
        }
        
        if(email == undefined){
          email = req.token.userEmail
        }else{
            if(!validator.isValidEmail(email)){
                return res.status(400).send({status:false, message:"Invalid email"})
            }
        }
        //

        let userId = req.token.userId
        data={title,description,email,skills,experience,userId}

        // checking job post uniqueness
        let job = await jobModel.findOne({userId:req.token.userId,title,isDeleted:false})
        if(job){
            return res.status(400).send({stauts:false, message:"this job is already posted"})
        }
        //

        let newJob = await jobModel.create(data)
        return res.status(201).send({status:true, message:"Job posted", data:newJob})
        
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const updateJobPosting = async function(req,res){
    try{
        let jobId = req.params.jobId
        let {title,description,email,skills,experience}=req.body
        // console.log(req.body)
        if(!validator.isValidObjectId(jobId)){
            return res.status(400).send({status:false, message:"invalid jobId"})
        }
        if(!validator.isValidObject(req.body)){
            return res.status(400).send({stauts:false, message:"pls provide job detatils to update"})
        }

        let job = await jobModel.findOne({_id:jobId,isDeleted:false})
        if(!job){
            return res.status(404).send({status:false, message:"no job found"})
        }

        //Authorization check
        if(req.token.userId!=job.userId){
            return res.status(403).send({status:false, message:"Unauthorized"})
        }

        let data={userId:req.token.userId}

        // validations
        if(title || title==""){
            if(!title.trim() || !validator.isValidAlphaNum(title)){
                return res.status(400).send({status:false, message:"title can only contains numbers, alphabets and - , _ , ."})
            }   
            data.title=title
        }

        if(description || description==""){
            if(!description.trim() || !validator.isValidAlphaNum(description)){
                return res.status(400).send({status:false, message:"description can only contains numbers, alphabets and - , _ , ."})
            }   
            data.description=description
        }
        
        if(email || email==""){
            if(!validator.isValidEmail(email)){
                return res.status(400).send({status:false, message:"Invalid email"})
            }   
            data.email=email
        }
        
        if(experience || experience==""){
            if(!experience.trim() || !validator.isValidNumber(experience.trim())) return res.status(400).send({status:false, message:"experience should be valid no. of year"})
            data.experience=Number(experience.trim())
        }

        if(skills || skills==""){
            if(!skills.trim() || !validator.isValidAlphaNum(skills)){
                return res.status(400).send({status:false, message:"skills can only contains numbers, alphabets and - , _ , ."})
            }   
            data.skills=skills
        }
        ///

        let newJob = await jobModel.findByIdAndUpdate(jobId,data,{new:true})
        return res.status(201).send({status:true, message:"Job post updated", data:newJob})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const deleteJobPost = async function(req,res){
    try{
        let jobId = req.params.jobId
        if(!validator.isValidObjectId(jobId)){
            return res.status(400).send({status:false, message:"invalid jobId"})
        }

        let jobPost = await jobModel.findOne({_id:jobId,isDeleted:false})
        if(!jobPost) return res.status(400).send({status:false, message:"job post not found"})

        // Authorization check
        if(jobPost.userId!=req.token.userId) return res.status(403).send({status:false, message:"Unauthorized"})

        await jobModel.findByIdAndUpdate(jobId,{isDeleted:true},{new:true})
        return res.status(200).send({stauts:true, message:"Job post deleted"})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const viewAllJobPost = async function(req,res){
    try{
        let {skills,experience,pageNumber,limit}=req.query
        // console.log(req.query)
        let obj={isDeleted:false}

        // validating query params
        let fields=["skills","experience","pageNumber","limit"]
        for(let key in req.query){
           
            if(!fields.includes(key)) return res.status(400).send({stauts:false, message:`query params can be - ${fields.join(",")}`})
        }

        // Check for values of queryParams
        for(let key in req.query){
            if(req.query[key].length==0){
                res.status(400).send({status:false, msg:`${key} field can't be empty`})
                return
            }
        }

        // validations
        if(skills){
            if(validator.isValid(skills)) {
                
                skills=skills.trim()
                obj["skills"]={$regex:skills, $options:"i"}
            }
        }
        if(experience){
            if(validator.isValidNumber(experience)) {
                experience=Number(experience.trim())
                obj["experience"]={$lte:experience}
            }
        }

        // pagination
        pageNumber = parseInt(pageNumber) || 1;
        limit = parseInt(limit) || 2;
        const result = {};

        const totalPosts = await jobModel.find(obj).count();
        let startIndex = (pageNumber - 1) * limit;
        const endIndex = (pageNumber) * limit;
        if (startIndex > 0) {
        result.previous = {
            pageNumber: pageNumber - 1,
            limit: limit,
        };
        }
        if (endIndex < totalPosts) {
        result.next = {
            pageNumber: pageNumber + 1,
            limit: limit,
        };
        }
        result.data = await jobModel.find(obj)
        .skip(startIndex)
        .limit(limit)
        .select({_id:0,title:1,description:1,skills:1,experience:1,email:1})
        result.limitOfPage = limit;
       
        return res.status(200).send({status:true, totalNumberOfJobs:totalPosts, jobs:result})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const viewJobPost = async function(req,res){
    try{
        let jobId = req.params.jobId

        if(!validator.isValidObjectId(jobId)){
            return res.status(400).send({status:false, message:"Invalid jobId"})
        }

        let job = await jobModel.findOne({_id:jobId,isDeleted:false}).select({_id:0,title:1,description:1,email:1,experience:1,skills:1})
        if(!job){
            return res.status(200).send({status:true, message:"no job found"})
        }

        return res.status(200).send({status:true, job:job})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const jobApply = async function(req,res){
    try{
        const jobId = req.params.jobId
        let {name,email}=req.body

        // validations
        if(!validator.isValidObjectId){
            return res.status(400).send({status:false, message:"Invalid jobId"})
        }
        if(!validator.isValid(name)){
            return res.status(400).send({status:false, message:"name is required"})
        }
        if(!validator.isValid(email)){
            return res.status(400).send({status:false, message:"email is required"})
        }

        if(!validator.isValidName(name)){
            return res.status(400).send({status:false, message:"name must contains only alphabets"})
        }
        if(!validator.isValidEmail(email)){
            return res.status(400).send({status:false, message:"Invalid email"})
        }
        //

        let files = req.files
        // console.log(files["resume"],files["coverLetter"])
        if(!files["resume"]) return res.status(400).send({status:false ,message:"pls provide resume with '.pdf' extension"})
        if(!files["coverLetter"]) return res.status(400).send({status:false ,message:"pls provide coverLetter with '.md' extension"})
        
        let resume = files["resume"][0].path
        let coverLetter = files["coverLetter"][0].path

        let jobData =  await jobModel.findOne({_id:jobId,isDeleted:false})
        if(!jobData) return res.status(404).send({status:false ,message:"no such job"})
        
        if(req.token.userId == jobData.userId){
            return res.status(400).send({status:false,message:"you can't apply on your own job post"})
        }

        let candidate = jobData.appliedCandidates
        for(let key of candidate){
            if(key["resume"]==resume) return res.status(400).send({status:false, message:"you already applied for this job"})
        }
        
        let data={name,email,resume,coverLetter,candidate:req.token.userId}
        let newCandidate = await jobModel.findByIdAndUpdate(jobId,{$push:{appliedCandidates:data}},{new:true})
        // console.log(candidate)
        return res.status(200).send({stauts:true, message:"applied", data:newCandidate})

    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const deleteJobApplication = async function(req,res){
    try{
        let jobId = req.params.jobId

        if(!validator.isValidObjectId(jobId)){
            return res.status(400).send({status:false, message:"Invalid jobId"})
        }


        let job = await jobModel.findOne({_id:jobId,isDeleted:false}).lean()
        if(!job)  return res.status(400).send({status:false, message:"no such job post found"})
        // console.log(job.appliedCandidates)
        let applied=false;
        for(let key in job.appliedCandidates){
            if(job.appliedCandidates[key].candidate==req.token.userId) {
                applied=true;
                job.appliedCandidates.splice(key,1);
                break;
            }
        }
        if(!applied){
            return res.status(400).send({stauts:false, message:"you did't apply for this job"})
        }
        await jobModel.findByIdAndUpdate(jobId,{$set:{appliedCandidates:job.appliedCandidates}})
        return res.status(200).send({status:true, message:"application deleted"})
        
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


const viewCandidates = async function(req,res){
    try{
        let jobId = req.params.jobId

        if(!validator.isValidObjectId(jobId)){
            return res.status(400).send({status:false, message:"Invalid jobId"})
        }

        let job = await jobModel.findOne({_id:jobId,isDeleted:false}).lean()

        if(req.token.userId!=job.userId){
            return res.status(403).send({status:false, message:"Unauthorized"})
        }

        if(!job){
            return res.status(400).send({status:false, message:"no post found"})
        }

        // pagination
        pageNumber = parseInt(req.query.pageNumber) || 1;
        limit = parseInt(req.query.limit) || 2;
        const result = {};

        const totalCandidates = job.appliedCandidates.length;
        let startIndex = (pageNumber - 1) * limit;
        const endIndex = (pageNumber) * limit;
        if (startIndex > 0) {
        result.previous = {
            pageNumber: pageNumber - 1,
            limit: limit,
        };
        }
        if (endIndex < totalCandidates) {
        result.next = {
            pageNumber: pageNumber + 1,
            limit: limit,
        };
        }
        result.limitOfPage = limit;
        result.candidates=[]
        let i=0
        for(let key of job.appliedCandidates){
            if(i>=startIndex && i<endIndex){
                let content = await fs.readFile(key["coverLetter"],"utf8")
                let html = markdown.toHTML(content)
                key["coverLetter"]=html
                delete key["resume"]
                result.candidates.push(key)
            }
            i++
        }
        return res.status(200).send({status:true, numberOfCandidates:totalCandidates, candidates:result})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


module.exports={
    userRegister,
    login,
    createJob,
    viewAllJobPost,
    viewJobPost,
    viewCandidates,
    jobApply,
    updateJobPosting,
    deleteJobPost,
    deleteJobApplication,
    upload
}