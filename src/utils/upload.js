const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'src/uploads')
    },
    filename:function(req,file,cb){
        let ext=file.originalname.split(".")[1]
        cb(null,Date.now()+"."+ext)
    }
})

const upload = multer({
    storage:storage,
    fileFilter:function(req,file,callback,res){
        console.log(file,req.body)
        if( file.mimetype=='file/pdf'){
            callback(null,true)
        }
        else{
            console.log("only pdf format is accepted")
            callback(null, false)
        }
    },
    limits:1024*1024*8  // 8 mb
}) 

module.exports=upload