'use strict';

/**
@author: Varun Ojha
@version: 2.0
@date: 22/11/2016
@Description: Blockchain network configuration api
**/

var Promise = require('bluebird');
var hfc = require('hfc');
var fs = require('fs');


var config = require('config');
var logHelper = require('../logging/logging.js');
var logger = logHelper.getLogger('blockchain_network');
var validate = require('../utils/validation_helper.js');
var constants = require('../constants/constants.js');
var chaincodeName;
var chaincodeID;
var chain;

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================

var peerURLs = [];
var caURL = null;
var users = null;
var registrar = null; //user used to register other users and deploy chaincode
var peerHosts = [];
var peerEventHosts = [];
var registrarPassword = "";
var isSetupComplete = false;
var retryLimit = 4;
var retryInterval = 2000;


/**
Initialize chain
**/
function chainInit(params){
	return new Promise(function(resolve, reject){
		try{
			logHelper.logEntryAndInput(logger, 'chainInit', params);

			if(!validate.isValidJson(params)){
				logHelper.logError(logger, 'chainInit', 'Invalid params');
				return reject({statusCode: constants.INVALID_INPUT, body: 'Could not initialize Chain. Invalid params' })
			}

			var ccName = params.ccName;
			if(!validate.isValidString(ccName)){
				logHelper.logError(logger, 'chainInit', 'Invalid ccName');
				return reject({statusCode: constants.INVALID_INPUT, body: 'Could not initialize Chain. Invalid ccName' })
				
			}

			var kvStorePath = params.kvStorePath;
			if(!validate.isValidString(kvStorePath)){
				logHelper.logError(logger, 'chainInit', 'Invalid kvStorePath');
				return reject({statusCode: constants.INVALID_INPUT, body: 'Could not initialize Chain. Invalid kvStorePath' })
				
			}

			chain = hfc.newChain(ccName);
			// Configure the KeyValStore which is used to store sensitive keys
			// as so it is important to secure this storage.
			chain.setKeyValStore(hfc.newFileKeyValStore(kvStorePath));
			chain.setDeployWaitTime(100);
			//chain.setECDSAModeForGRPC(true);

			logHelper.logMessage(logger, 'chainInit', 'Chain Initialized', chain);
			return resolve({statusCode: constants.SUCCESS, body: 'Chain Initialized' })
		}
		catch(err){
			logHelper.logError(logger, 'chainInit', 'Could not initialize Chain', err);
			return reject({statusCode: constants.INVALID_INPUT, body: 'Could not initialize Chain' });
		}
	});
}

/**
Load all blockchain network information from config or vcap
**/

function loadNetworkConfiguration(blockchainConfig){
	return new Promise(function(resolve, reject){
		try {
			logHelper.logEntryAndInput(logger, 'loadNetworkConfiguration');
			
			if(!validate.isValidJson(blockchainConfig)){
				logHelper.logError(logger, 'loadNetworkConfiguration', 'Invalid blockchainConfig');
				return reject({statusCode: constants.INVALID_INPUT, body: 'Could not loadNetworkConfiguration. Invalid blockchainConfig' });
			}

		    //var bcServices = util.getVcapServices(constants['VCAP_SERVICES_BLOCKCHAIN']);
		    var bcService = blockchainConfig;//bcServices[0];
		    
		    var peers = bcService.credentials.peers;
		    for (var i in peers) {
		        peerURLs.push(constants['BLOCKCHAIN_NW_PROTOCOL'] + peers[i].discovery_host + ":" + peers[i].discovery_port);
		        peerHosts.push("" + peers[i].discovery_host);
				peerEventHosts.push(constants['BLOCKCHAIN_NW_PROTOCOL'] + peers[i].event_host+ ":" + peers[i].event_port );
		    }
		    var ca = bcService.credentials.ca;
		    for (var i in ca) {
		        caURL = constants['BLOCKCHAIN_NW_PROTOCOL'] + ca[i].url;
		    }

			//users are only found if security is on
		    if (bcService.credentials.users) users = bcService.credentials.users;
		    for (var z in users) {
			    if (users[z].username == constants['BLOCKCHAIN_REGISTRAR_ID']) {
			        registrarPassword = users[z].secret;
			    }
			}

			logHelper.logMessage(logger, 'loadNetworkConfiguration', 'Successfully loaded network configuration');
			return resolve({statusCode: constants.SUCCESS, body: 'Successfully loaded network configuration'});

		}
		catch (err) {
		    logHelper.logError(logger, 'loadNetworkConfiguration', 'Could not load Network Configuration', err);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not load Network Configuration'});
		}
	});
	
}




/**
Configure the chain with network configuration
Enroll the Registrar 
**/
function configureNetwork() {
	return new Promise(function(resolve, reject){

		try{
			logHelper.logEntryAndInput(logger, 'configureNetwork');
			var pem;
			fs.readFile(constants['BLOCKCHAIN_NW_CERT_PATH'], function(err, data){
				if(validate.isValid(err)){
					logHelper.logError(logger,'configureNetwork', 'Could not read cert: '+constants['BLOCKCHAIN_NW_CERT_PATH']);
					return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not read cert: '+constants['BLOCKCHAIN_NW_CERT_PATH'] });
				}
				else{
					pem = data;
					chain.setMemberServicesUrl(caURL, { pem: pem });
					for (var i in peerURLs) {
		        		chain.addPeer(peerURLs[i], { pem: pem });
		    		}

					/** Uncomment below two lines for testing event framework */
					chain.eventHubConnect(peerEventHosts[0],{pem:pem});
					setupEvents();
					
					recursiveLogin({username: constants['BLOCKCHAIN_REGISTRAR_ID'], password: registrarPassword, chain: chain })
					.then(function(resp){
						logHelper.logMessage(logger,'configureNetwork', 'Successfully enrolled registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID']);
					    var registrarMember = resp.body;
						chain.setRegistrar(registrarMember);
				    	return resolve({statusCode: constants.SUCCESS, body: 'Network configuration complete'});
					})
					.catch(function(err){
						return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not enroll registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID'] });
					})

		    		// chain.getMember(constants['BLOCKCHAIN_REGISTRAR_ID'], function (err, member) {
				    //     if (validate.isValid(err)) {
				    //         logHelper.logError(logger,'configureNetwork', 'Could not get registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID'], err);
				    //         return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not get registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID'] });
				    //     } 
				    //     else {
				    //         logHelper.logMessage(logger,'configureNetwork', 'Successfully got registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID']);

				    //         // Enroll the Registrar member with the certificate authority using
				    //         // the one time password hard coded inside the membersrvc.yaml.
				    //         member.enroll(registrarPassword, function (err, crypto) {
				    //             if (validate.isValid(err)) {
				    //         		logHelper.logError(logger,'configureNetwork', 'Could not enroll registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID'], err);
				    //         		return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not enroll registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID'] });
				    //     		}  
				    //     		else {
				    //                 logHelper.logMessage(logger,'configureNetwork', 'Successfully enrolled registrar: '+constants['BLOCKCHAIN_REGISTRAR_ID']);
					// 				chain.setRegistrar(member);
				    //                 return resolve({statusCode: constants.SUCCESS, body: 'Network configuration complete'});
				    //                 // Confirm that the Registrar token has been created in the key value store
				    //                 // var path = chain.getKeyValStore().dir + "/member." + member.getName();

				    //                 // fs.exists(path, function (exists) {
				    //                 //     if (exists) {
				    //                 //         logHelper.logMessage(logger,'configureNetwork', 'Successfully stored client token for registrar: '+member.getName());
				    //                 //         chain.setRegistrar(member);
				    //                 //         return resolve({statusCode: constants.SUCCESS, body: 'Network configuration complete'});
				    //                 //     } else {
				    //                 //         logHelper.logError(logger,'configureNetwork', 'client token not stored for registrar: '+member.getName());
				    //         		// 	    return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'client token not stored for registrar: '+member.getName() });
				    //                 //     }
				    //                 // });
				    //             }
				                
				                

				               

				    //         });
				    //     }
				    // });	
				}

			});
	   
		}
		catch(err){
			logHelper.logError(logger, 'configureNetwork', 'Could not configure network', err);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not configure network', err});
		}
	});
	
}

/**
Setup the blockchain network
**/
function setupBlockchain(params){
	return new Promise(function(resolve,reject){
		try{
			logHelper.logEntryAndInput(logger, 'setupBlockchain', params);

			if(!validate.isValidJson(params)){
				logHelper.logError(logger, 'setupBlockchain', 'Invalid params');
				return reject({statusCode: constants.INVALID_INPUT, body: 'Could not setup blockchain. Invalid params' });
			}
			// var goPath = __dirname+'/../../chaincode/';
			// process.env.GOPATH = goPath;
			// console.log('setting GOPATH: '+goPath);
			
			chainInit({ccName: params.ccName, kvStorePath: params.kvStorePath, kvStore: params.kvStore})
			.then(function(resp){
				return loadNetworkConfiguration(params.blockchainConfig);
			})
			.then(function(resp){
				return configureNetwork();
			})
			// .then(function(result){
			// 	return recursiveDeploy({functionName: 'init', chaincodePath: 'sample_chaincode'})
			// })
			.then(function(resp){
				logHelper.logMessage(logger, 'setupBlockchain', 'blockchain setup complete');
				isSetupComplete = true;
				return resolve({statusCode: constants.SUCCESS, body: 'blockchain setup complete'});
			})
			.catch(function(err){
				logHelper.logError(logger, 'setupBlockchain', 'Could not setup blockchain', err);
				return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not setup blockchain', err});
			});
		}
		catch(err){
			logHelper.logError(logger, 'setupBlockchain', 'Could not setup blockchain', err);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not setup blockchain', err});
		}
	});
}

/**
Returns the initialized chain
**/
function getChain(){
	console.log(isSetupComplete);
	if(!isSetupComplete){
		throw new Error('Please complete blockchain setup before accessing chain');
	}
	
	return chain;
}

/**
Enroll user with the Blockchain CA
**/
function doLogin(params) {
    return new Promise(function(resolve, reject){

        try{
            logHelper.logMethodEntry(logger, 'doLogin');
            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'doLogin', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid params' })
            }

            var username = params.username;
            if(!validate.isValidString(username)){
                logHelper.logError(logger, 'doLogin', 'Invalid username');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid username' })
            }

            var password = params.password;
            if(!validate.isValidString(password)){
                logHelper.logError(logger, 'doLogin', 'Invalid password');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid password' })
            }

			var chainObj = params.chain;
            if(!validate.isValid(chainObj)){
                logHelper.logError(logger, 'doLogin', 'Invalid chain object');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not login user. Invalid chain object' })
            }

			var memberObj;
            var chainAsync = Promise.promisifyAll(chainObj);

			
            chainAsync.getMemberAsync(username)
            .then(function(member){
				console.log(member);
				memberObj = member;
                var memberAsync = Promise.promisifyAll(member);
				
                return memberAsync.enrollAsync(password);
            })
            .then(function(crypto){
                logHelper.logMessage(logger, 'doLogin', 'Successfully logged in user on blockchain: '+username);
                return resolve({statusCode: constants.SUCCESS, body: memberObj});
            })
            .catch(function(err){
                logHelper.logError(logger, 'doLogin', 'Could not login user on blockchain: '+username, err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not login user' });
            });

        }
        catch(err){
            logHelper.logError(logger, 'doLogin', 'Could not login user on blockchain: '+username, err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not login user' });
        }
    });
}

function recursiveLogin(params){
    if(!validate.isValid(params.retryCounter)){
        params.retryCounter = 0;
    }
    else{
        params.retryCounter = params.retryCounter + 1;
    }

    return doLogin(params).catch(function(err) {
        if(err.statusCode == constants.INVALID_INPUT || params.retryCounter > retryLimit){
            logHelper.logError(logger, 'recursiveLogin', "Login Retries Exhausted", err)
            return Promise.reject(err);
        }
        return Promise.delay(retryInterval).then(function(){
            return recursiveLogin(params);
        });
    });
}

function doDeployChaincode(params) {
    return new Promise(function(resolve, reject) {
		try{
            logHelper.logMethodEntry(logger, 'deployChaincode');
            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'deployChaincode', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not deploy chaincode. Invalid params' })
            }
			var chaincodePath = params.chaincodePath;
			if(!validate.isValidString(chaincodePath)){
                logHelper.logError(logger, 'deployChaincode', 'Invalid chaincodePath');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not deploy chaincode. Invalid chaincodePath' })
            }
			var functionName = params.functionName;
			if(!validate.isValidString(functionName)){
                logHelper.logError(logger, 'deployChaincode', 'Invalid functionName');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not deploy chaincode. Invalid functionName' })
            }
			var args = params.args;
			if(!validate.isValidArray(args)){
                args = [];
            }
			var forceDeploy = false;
			if(validate.isValidBoolean(params.forceDeploy)){
				forceDeploy = params.forceDeploy;
			}
			var regMember = chain.getRegistrar();
			var chaincodeId = config['chaincode']['id'];
			console.log(chaincodeId);
			if(!validate.isValidString(chaincodeId) || forceDeploy == true){
				//Deploy the chaincode
				var deployRequest = {
					fcn: functionName,
					args: args,
					chaincodePath: chaincodePath
        		};

				var deployTx = regMember.deploy(deployRequest);
				deployTx.on('submitted', function(result) {
            		logHelper.logMessage(logger,"deployChaincode","Submitted Transaction for chaincode deployment");
       		 	});

				deployTx.on('complete', function (result) {
					logHelper.logMessage(logger,"deployChaincode","Chaincode successfully deployed with ID: "+result.chaincodeID);
					config['chaincode']['id'] = result.chaincodeID;
					fs.writeFileSync(__dirname+'/../../config/chaincode.txt', result.chaincodeID, 'utf8');
					params['isDeployed'] = true;
					return resolve({statusCode: constants.SUCCESS, body: result});
				});

				deployTx.on('error', function (error) {
					logHelper.logError(logger, 'deployChaincode', 'Could not deploy chaincode',error);
					var err = error;
					if (err instanceof hfc.EventTransactionError) {
						err = new Error(error.msg);
					}
					
					return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: err})
					
				});
			}
			else{
				//chaincode already deployed.
				logHelper.logMessage(logger,"deployChaincode","Chaincode already deployed with ID: "+config['chaincode']['id']);
				return resolve({statusCode: constants.SUCCESS, body: 'chaincode already deployed: '+config['chaincode']['id']});
			}

		}
		catch(err){
			logHelper.logError(logger, 'deployChaincode', 'Could not deploy chaincode',err);
			return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: err})
		}


        
    });
}

function recursiveDeploy(params){
    if(!validate.isValid(params.retryCounter)){
        params.retryCounter = 0;
    }
    else{
        params.retryCounter = params.retryCounter + 1;
    }

    return doDeployChaincode(params).catch(function(err) {
        if(err.statusCode == constants.INVALID_INPUT || params.retryCounter > retryLimit){
            logHelper.logError(logger, 'recursiveDeploy', "Deploy Chaincode Retries Exhausted", err)
            return Promise.reject(err);
        }
        return Promise.delay(retryInterval).then(function(){
            return recursiveDeploy(params);
        });
    });
}

/**
 * Sample method to showcase how to subscribe and consume events emitted from blockchain
 */
function setupEvents(){
	try{
	var eh = chain.getEventHub();
	var cid = config['chaincode']['id'];
	var regid = eh.registerChaincodeEvent(cid, "^eventSender$", function(event) {
		console.log(event);
		var buffer = new Buffer(event.payload);
		console.log(buffer.toString());
    });
	console.log("EVENT SETUP DONE");
}
catch(err){
	console.log(err);
	console.log("Could not setup events");
}
}

process.on('exit', function (){
	console.log('exit called');
  	chain.eventHubDisconnect();
});


module.exports = {
	setupBlockchain: setupBlockchain,
	getChain: getChain
	
};



