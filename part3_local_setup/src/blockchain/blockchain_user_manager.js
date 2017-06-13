/*eslint-env node */
"use strict";

/**
@author: Varun Ojha
@version: 1.0
@date: 16/09/2016
@Description: User management API for registration/enrollment on blockchain
**/

var Promise = require('bluebird');
var logHelper = require('../logging/logging.js');
var logger = logHelper.getLogger('blockchain_user_manager');
var validate = require('../utils/validation_helper.js');
var util = require('../utils/util.js');
var constants = require('../constants/constants.js');
var bcNetwork = require('../blockchain/blockchain_network.js');
var bcSdk = require('../blockchain/blockchain_sdk.js');



/**
Register a new user with the Blockchain CA

function registerUser(params) {
    return new Promise(function(resolve, reject){
        var username;
        try{
            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'registerUser', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid params' })
            }

            username = params.username;
            if(!validate.isValidString(username)){
                logHelper.logError(logger, 'registerUser', 'Invalid username');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid username' })
            }

            var account = params.account;
            if(!validate.isValidString(account)){
                logHelper.logError(logger, 'registerUser', 'Invalid account');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid account' })
            }

            var affiliation = params.affiliation;
            if(!validate.isValidString(affiliation)){
                logHelper.logError(logger, 'registerUser', 'Invalid affiliation');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid affiliation' })
            }

            var enrollsecret
            var chain = bcNetwork.getChain();
            var reg = chain.getRegistrar();
            var chainAsync = Promise.promisifyAll(chain);

            chainAsync.getMemberAsync(username)
            .then(function(member){
                var memberAsync = Promise.promisifyAll(member);
                
                    var registrationRequest = {
                        enrollmentID: username,
                        attributes: [
                            {name: 'role', value: affiliation},
                            {name: 'username', value: username}
                        ],
                        affiliation: 'group1',
                        registrar: reg,
                        roles: ['client']
                        
                    };
                    
                return memberAsync.registerAsync(registrationRequest);
            })
            .then(function(enrollsec){
                logHelper.logMessage(logger, 'registerUser', 'Successfully registered user on blockchain: '+username);
                enrollsecret = enrollsec;
                return bcSdk.createUser({user: constants['BLOCKCHAIN_REGISTRAR_ID'], username: username, affiliation: affiliation})
                
            })
            .then(function(resp){
                logHelper.logMessage(logger, 'registerUser', 'Successfully created user on blockchain ledger: '+username);
                return resolve({statusCode: constants.SUCCESS, body: {credentials:{username: username, password: enrollsecret}}});
            })
            .catch(function(err){
                logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain: '+username, err);
                console.log(err.cause);
                console.log(err.metadata);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
            })
        }
        catch(err){
            logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain: '+username, err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
        }
    });
   
}**/

function registerUser(params) {
    return new Promise(function(resolve, reject){
        var username;
        try{
            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'registerUser', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid params' })
            }

            username = params.username;
            if(!validate.isValidString(username)){
                logHelper.logError(logger, 'registerUser', 'Invalid username');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid username' })
            }

            var account = params.account;
            if(!validate.isValidString(account)){
                logHelper.logError(logger, 'registerUser', 'Invalid account');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid account' })
            }

            var affiliation = params.affiliation;
            if(!validate.isValidString(affiliation)){
                logHelper.logError(logger, 'registerUser', 'Invalid affiliation');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not register user. Invalid affiliation' })
            }
            var enrollsecret;

            bcSdk.recursiveRegister(params)
            .then(function(resp){
                //logHelper.logMessage(logger, 'registerUser', 'Successfully registered user on blockchain: '+username);
                enrollsecret = resp['body']['password'];
                return bcSdk.createUser({user: constants['BLOCKCHAIN_REGISTRAR_ID'], username: username, affiliation: affiliation})
                
            })
            .then(function(resp){
                logHelper.logMessage(logger, 'registerUser', 'Successfully created user on blockchain ledger: '+username);
                return resolve({statusCode: constants.SUCCESS, body: {credentials:{username: username, password: enrollsecret}}});
            })
            .catch(function(err){
                 logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain '+username, err);
                 return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
            })
            
            
        }
        catch(err){
            logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain: '+username, err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
        }
    });
   
}

/*function doRegisterUserOnBlockchain(params) {
    return new Promise(function(resolve, reject){
        
        var username = params.username;
        var account = params.account;
        var affiliation = params.affiliation;

        try{

            var enrollsecret
            var chain = bcNetwork.getChain();
            var reg = chain.getRegistrar();
            var chainAsync = Promise.promisifyAll(chain);

            chainAsync.getMemberAsync(username)
            .then(function(member){
                var memberAsync = Promise.promisifyAll(member);
                
                    var registrationRequest = {
                        enrollmentID: username,
                        attributes: [
                            {name: 'role', value: affiliation},
                            {name: 'username', value: username}
                        ],
                        affiliation: 'group1',
                        registrar: reg,
                        roles: ['client']
                        
                    };
                    
                return memberAsync.registerAsync(registrationRequest);
            })
            .then(function(enrollsec){
                logHelper.logMessage(logger, 'registerUser', 'Successfully registered user on blockchain: '+username);
                enrollsecret = enrollsec;
                return resolve({statusCode: constants.SUCCESS, body: {credentials:{username: username, password: enrollsecret}}});
                
            })
            .catch(function(err){
                logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain: '+username, err);
                console.log(err.cause);
                console.log(err.metadata);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
            })
        }
        catch(err){
            logHelper.logError(logger, 'registerUser', 'Could not register user on blockchain: '+username, err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not register user' });
        }
    });
   
}

function recursiveRegister(params){
   if(!isValid(params.retryCounter)){
        params.retryCounter = 0;
    }
    else{
        params.retryCounter = params.retryCounter + 1;
    }

    return doRegisterUserOnBlockchain(params).catch(function(err) {
        if(params.retryCounter > retryLimit){
            logHelper.logError(logger, 'recursiveRegister', "Register Retries Exhausted", err)
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body:"Register Retries exhausted"});
        }
        return Promise.delay(2000).then(function(){
            return recursiveRegister(params);
        });
    });
}

*/

/**
Enroll user with the Blockchain CA
**/
function loginUser(params) {
    return new Promise(function(resolve, reject){
        try{
            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'loginUser', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid params' })
            }

            var username = params.username;
            if(!validate.isValidString(username)){
                logHelper.logError(logger, 'loginUser', 'Invalid username');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid username' })
            }

            var password = params.password;
            if(!validate.isValidString(password)){
                logHelper.logError(logger, 'loginUser', 'Invalid account');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid password' })
            }

            var chain = bcNetwork.getChain();
            var chainAsync = Promise.promisifyAll(chain);

            bcSdk.recursiveLogin(params)
            .then(function(resp){
                logHelper.logMessage(logger, 'loginUser', 'Successfully logged in user on blockchain: '+username);
                return resolve(resp);
            })
            .catch(function(err){
                logHelper.logError(logger, 'loginUser', 'Could not login user on blockchain: '+username, err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not login user' });
            });

        }
        catch(err){
            logHelper.logError(logger, 'loginUser', 'Could not login user on blockchain: '+username, err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not login user' });
        }
    });
}






module.exports = {
    registerUser: registerUser,
    loginUser: loginUser
}

