'use strict';

/**
@author: Varun Ojha
@version: 1.0
@date: 05/02/2017
@Description: Utility file with common functions
**/

var config = require('config');

var logHelper = require('../logging/logging.js');
var logger = logHelper.getLogger('util.js');
var validate = require('./validation_helper.js');
var constants = require('../constants/constants.js');


module.exports = {
    getVcapServices: getVcapServices,
    getUserDefinedProperty: getUserDefinedProperty,
    isSessionValid: isSessionValid,
    stringStartsWith: stringStartsWith,
    getBlockchainPeer: getBlockchainPeer,
    getBlockchainCA: getBlockchainCA,
    getBlockchainPeerUrl: getBlockchainPeerUrl
}
/**
Returns VCAP_SERVICES from the environment variables if available or from the local config file
**/
function getVcapServices(serviceName){

    var service;
    try{

        if(!validate.isValidString(serviceName)){
            logHelper.logError(logger, 'getVcapServices', 'serviceName is invalid');
            return null;
        }
        
        service = config['VCAP_SERVICES'][serviceName];
        
        if(!validate.isValid(service)){
            service = null;
        }

        if(validate.isValid(process['env']['VCAP_SERVICES'])){
        
            var vcap = JSON.parse(process['env']['VCAP_SERVICES']);

            if(validate.isValidJson(vcap[serviceName])){
                service = vcap[serviceName];
            }
        
        
        }

        return service;
    } 
    catch(error){
        logHelper.logError(logger, 'getVcapServices', 'Could not get VCAP_SERVICES', error);
        return null;
    }
    
    
    
}

function getUserDefinedProperty(propertyName){
   
    try{

        if(!validate.isValidString(propertyName)){
            return null;
        }

       if(validate.isValid(process['env']['VCAP_SERVICES'])){
            var userDefined = process['env']['USER_DEFINED'];

            var userDefinedProps = JSON.parse(userDefined);

            return userDefinedProps[propertyName];
       }
       else{
            
            var prop = config[propertyName];
            if(validate.isValid(prop)){
                return prop;
            }
            else{
                return null;
            }
       }
    }
    catch(error){
        logHelper.logError(logger, 'getUserDefinedProperty', 'Could not fetch property '+propertyName, error);
        return null;
    }
}

function getBlockchainPeer(serviceName, peer){
    var svc = getVcapServices(serviceName);
    return svc[0]['credentials']['peers'][peer];
}

function getBlockchainPeerUrl(serviceName, peer, secure){
    var protocol = "https://"
    if( secure == false){
        protocol = "http://"
    }

    var svc = getVcapServices(serviceName);
    var url = protocol;
    var peer = svc[0]['credentials']['peers'][peer];
    url+= peer['api_host']+':'+peer['api_port_tls'] 
    return url
}

function getBlockchainCA(serviceName){
    var svc = getVcapServices(serviceName);
    var ca = svc[0]['credentials']['ca'];
    return ca[Object.keys(ca)[0]];
}


/**
Validate if a session is valid
**/
function isSessionValid(session){
   

    if(validate.isValid(session)){
        var user = session.user;
        if(validate.isValidJson(user)){
            return true;
        }
    }
        
    return false;
}


function stringStartsWith (string, prefix) {
    if(!validate.isValidString(string) || !validate.isValidString(prefix)){
        return false;
    }

    return string.slice(0, prefix.length) == prefix;
}

/**
Checks each item in the array for the list of key value combinations.
Depth 1 only
**/
function arrayContainsKeyValue(array, keyValues){

    if(!validate.isValidArray(array) || !validate.isValidArray(keyValues)){
        return -1;
    }

    var matched = false;
    var matchedIndex = -1;

    for(var i=0; i< array.length; i++){
        if(matched == true){
            break;
        }
        var item = array[i];
        var itemKeys = Object.keys(item);

        for(var j=0; j< keyValues.length; j++){
            var keyValue = keyValues[j];
            var keys = Object.keys(keyValue);
            var index = itemKeys.indexOf(keys[0]);
            if(index > -1){
                if(item[keys[0]] == keyValue[keys[0]]){
                    matched = true;
                    matchedIndex = i;
                }
                else{
                    matched = false;
                    break;
                }
            }
            else{
                matched = false;
                break;
            }
        }

    }
   
    return matchedIndex;
}


function restoreLocalKeyValueStore(){
    
}