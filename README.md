# Hyperledger-Fabric-v6-tutorial

This tutorial series will help you write an end to end application using Hyperledger Fabric v0.6.
The tutorial is divided into three parts that cover chaincode development, chaincode unit testing and a node.js client application based on HFC SDK.

Part 1: Writing Blockchain chaincode in Go for Hyperledger Fabric v0.6
In this tutorial, learn how to develop chaincode using Golang for a blockchain network based on Hyperledger Fabric v0.6. I cover the fundamentals, such as the role of chaincode and the APIs for interacting with the underlying Fabric, as well as advanced topics like data modeling, access control, and events. Abundant code examples demonstrate a home loan and purchase contract process on blockchain. (See "Downloadable resources" at the end of this tutorial to download the entire sample chaincode.)
This tutorial is the first of a series; follow-on tutorials will cover how to unit test your chaincode and develop client applications that can invoke your deployed chaincode.

Access the detailed tutorial here
https://www.ibm.com/developerworks/cloud/library/cl-ibm-blockchain-chaincode-development-using-golang/index.html?ca=drs-


Part 2: Unit-testing your Blockchain chaincode in Go for Hyperledger Fabric v0.6
In this tutorial, learn the concepts of test-driven development and see how to apply this approach to writing chaincode in Golang for Hyperledger Fabric v0.6.
Ordinarily, unit-testing your chaincode would be cumbersome since you'd need to first deploy the chaincode in a blockchain network in a Docker container to have access to the underlying blockchain infrastructure, such as the ledger, transaction information, etc. This tutorial shows an alternative approach, where you can easily unit-test your chaincode using my CustomMockStub, which extends the MockStub available in the shim package.
This tutorial also includes examples that show how you can end up with a non-deterministic function in your chaincode and how to test for such non-deterministic functions.

Access the detailed tutorial here
https://www.ibm.com/developerworks/cloud/library/cl-ibm-blockchain-chaincode-testing-using-golang/index.html?ca=drs-

Part 3: Develop a client application for a blockchain network based on Hyperledger Fabric v0.6
With the Hyperledger Fabric Client SDK for Node.js, you can easily use APIs to interact with a blockchain based on Hyperledger Fabric v0.6. This tutorial shows you how to write some of the most common and necessary functions in a client application. All code examples in this tutorial are included in the reusable sample client that you can download and customize to fit your needs.
In this tutorial, the conclusion of a three-part series, you'll learn how to develop a Node.js client application to talk to a blockchain network based on Hyperledger Fabric v0.6. You'll learn about registration, enrollment, and access control through TCerts, and get code for setting up a blockchain network, a Cloudant-based key-value store, and an API layer for invoking and querying the blockchain. By following the steps in this tutorial, you can deploy the chaincode you developed in Part 1 onto the Blockchain service on IBM Bluemix® and invoke it from your client application.

Access the detailed tutorial here
https://www.ibm.com/developerworks/cloud/library/cl-ibm-blockchain-node-client-app/index.html?ca=drs-