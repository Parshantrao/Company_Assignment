const nameRegex=/^[a-z ]+$/i
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,19})/
const numberRegex =/^\d+$/
const alphaNumRegex = /^[\w-_,. ]*$/
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId

const isValidAlphaNum = function(data){
    return alphaNumRegex.test(data)
}
const isValidObject = function(data){
    return Object.keys(data).length>0
}
const isValid = function(data){
    if(typeof data === undefined || data==null) return false;
    if(typeof data ==="string" && data.trim().length==0) return false
    return true
}
const isValidName = function(data){
    return nameRegex.test(data)
}
const isValidEmail = function(data){
    return emailRegex.test(data)
}
const isValidPass = function(data){
    return passwordRegex.test(data)
}

const isValidNumber = function(data){
    return numberRegex.test(data)
}
const isValidObjectId = function(data){
    return ObjectId.isValid(data)
}

module.exports={
    isValid,
    isValidName,
    isValidEmail,
    isValidPass,
    isValidObject,
    isValidObjectId,
    isValidNumber,
    isValidAlphaNum
}


