'use strict';

/**
@author: Varun Ojha
@version: 1.0
@date: 04/02/2017
@Description: constants file
**/

module.exports = {
	//Http codes
	"INTERNAL_SERVER_ERROR": 500,
	"INVALID_INPUT": 400,
	"SUCCESS": 200,
	"SUCCESS_NO_CHANGE": 200,
	"UNAUTHORIZED": 401,
	"ERROR_START_CODE": 400,
	"NOT_FOUND": 404,

	"VCAP_SERVICES_CLOUDANT":"cloudantNoSQLDB",
	"VCAP_SERVICES_BLOCKCHAIN":"ibm-blockchain-5-prod",
	"CLOUDANT_INSTANCE_NAME": "cloudantInstanceName",
	"APP_MASTER_DB":"devWorksAppMaster",

	"BLOCKCHAIN_CHAINCODE_NAME" : "sc_cc",
	"BLOCKCHAIN_CHAINCODE" : "chaincode",
	"BLOCKCHAIN_CHAIN_KVSTORE_PATH" : "./tmp/keyValStore",
	"BLOCKCHAIN_CHAIN_KVSTORE_TEST_PATH" : "./test/tmp/keyValStore",

	"BLOCKCHAIN_NW_CERT_PATH" : "./us.blockchain.ibm.com.cert",
	"BLOCKCHAIN_NW_PROTOCOL" : "grpcs://",
	"BLOCKCHAIN_REGISTRAR_ID" : "WebAppAdmin",
	"BLOCKCHAIN_ADMIN_ID" : "admin",

	"BLOCKCHAIN_USER_AFFILIATION": "registrar",
	"BLOCKCHAIN_USER_AFFILIATION_CODE": "0001",
	"BLOCKCHAIN_USER_ROLE_ADMIN": 'admin',
	"BLOCKCHAIN_USER_GROUP": 'group1',

	"BLOCKCHAIN_API_REGISTRAR": 'registrar',

	"ENROLL_ID": "enrollId",
	"ENROLL_SECRET": "enrollSecret",

	//Models
	"MODEL_KEYVALUESTORE": 'keyvaluestore',
	"CLOUDANT_ID_FIELD": '_id'


	
	
	
}


