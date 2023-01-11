const express= require('express')
const multer = require('multer')
const router = express.Router()
const userController = require('../controllers/userController')
const auth = require('../middleware/auth')




router.use("/job",auth.auth)
// registeration, API
router.post("/user",multer().any(),userController.userRegister)

// Login, API
router.post("/login",multer().any(),userController.login)

// Create Job Post, API
router.post("/job",multer().any(),userController.createJob)

// update job post, API
router.put("/job/:jobId",multer().any(),userController.updateJobPosting) 

// Delete job post, API
router.delete("/job/:jobId",userController.deleteJobPost) 

// List of all jobs, API
router.get("/job",userController.viewAllJobPost) 

// detail of a job, API
router.get("/job/:jobId",userController.viewJobPost)

// apply for a job, API
router.post("/job/apply/:jobId" ,userController.upload.fields([{name:"resume" ,maxCount:1},{name:"coverLetter", maxCount:1}]), userController.jobApply)

// delete job appplication, API
router.delete("/job/apply/:jobId",userController.deleteJobApplication)

// candidates for job, API
router.get("/candidate/:jobId",auth.auth,userController.viewCandidates)


module.exports=router