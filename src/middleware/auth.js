const jwt = require('jsonwebtoken')

const auth = async function(req,res,next){
    try{
        const btoken = req.header("Authorization")
        // console.log( btoken.split(" "));
        
        if(!btoken){
            return res.status(401).send({status:false, message:"token is not present"})
        };
        const token = btoken.split(" ")[1]
        // console.log(token);
        jwt.verify(
            token,
            "SecretKeY",
            (err,result)=>{
                if(err) return res.status(401).send({status:false, message:err});
                req.token=result
                // console.log(result)
                next()
            }
        )
    }
    catch(err){
        return res.status(500).send({status:false,message:err})
    }
}

module.exports={
    auth
}

