package main

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

var loanApplicationID = "la1"
var loanApplication = `{"id":"` + loanApplicationID + `","propertyId":"prop1","landId":"land1","permitId":"permit1","buyerId":"vojha24","personalInfo":{"firstname":"Varun","lastname":"Ojha","dob":"dob","email":"varun@gmail.com","mobile":"99999999"},"financialInfo":{"monthlySalary":16000,"otherExpenditure":0,"monthlyRent":4150,"monthlyLoanPayment":4000},"status":"Submitted","requestedAmount":40000,"fairMarketValue":58000,"approvedAmount":40000,"reviewedBy":"bond","lastModifiedDate":"21/09/2016 2:30pm"}`

// func TestCreateLoanApplication(t *testing.T) {
// 	fmt.Println("Entering TestCreateLoanApplication")
// 	m := make(map[string][]byte)
// 	m["role"] = []byte("Bank")
// 	stub := NewMockStub("mockStub", new(SampleChaincode), m)
// 	bytes, _ := stub.ReadCertAttribute("role")
// 	fmt.Println(string(bytes))
// 	stub.MockInvoke("123", "init", []string{})

// }

func TestCreateLoanApplication(t *testing.T) {
	fmt.Println("Entering TestCreateLoanApplication")
	attributes := make(map[string][]byte)
	//Create a custom MockStub that internally uses shim.MockStub
	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}
}

func TestCreateLoanApplicationValidation(t *testing.T) {
	fmt.Println("Entering TestCreateLoanApplicationValidation")
	attributes := make(map[string][]byte)
	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	stub.MockTransactionStart("t123")
	_, err := CreateLoanApplication(stub, []string{})
	if err == nil {
		t.Fatalf("Expected CreateLoanApplication to return validation error")
	}
	stub.MockTransactionEnd("t123")

}

func TestCreateLoanApplicationValidation2(t *testing.T) {
	fmt.Println("Entering TestCreateLoanApplicationValidation2")
	attributes := make(map[string][]byte)
	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	stub.MockTransactionStart("t123")
	_, err := CreateLoanApplication(stub, []string{loanApplicationID, loanApplication})
	if err != nil {
		t.Fatalf("Expected CreateLoanApplication to succeed")
	}
	stub.MockTransactionEnd("t123")

}

func TestCreateLoanApplicationValidation3(t *testing.T) {
	fmt.Println("Entering TestCreateLoanApplicationValidation3")
	attributes := make(map[string][]byte)
	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	stub.MockTransactionStart("t123")
	CreateLoanApplication(stub, []string{loanApplicationID, loanApplication})
	stub.MockTransactionEnd("t123")

	var la LoanApplication
	bytes, err := stub.GetState(loanApplicationID)
	if err != nil {
		t.Fatalf("Could not fetch loan application with ID " + loanApplicationID)
	}
	err = json.Unmarshal(bytes, &la)
	if err != nil {
		t.Fatalf("Could not unmarshal loan application with ID " + loanApplicationID)
	}
	var errors = []string{}
	var loanApplicationInput LoanApplication
	err = json.Unmarshal([]byte(loanApplication), &loanApplicationInput)
	if la.ID != loanApplicationInput.ID {
		errors = append(errors, "Loan Application ID does not match")
	}
	if la.PropertyId != loanApplicationInput.PropertyId {
		errors = append(errors, "Loan Application PropertyId does not match")
	}
	if la.PersonalInfo.Firstname != loanApplicationInput.PersonalInfo.Firstname {
		errors = append(errors, "Loan Application PersonalInfo.Firstname does not match")
	}
	//Can be extended for all fields
	if len(errors) > 0 {
		t.Fatalf("Mismatch between input and stored Loan Application")
		for j := 0; j < len(errors); j++ {
			fmt.Println(errors[j])
		}
	}

}
func TestInvokeValidation(t *testing.T) {
	fmt.Println("Entering TestInvokeValidation")

	attributes := make(map[string][]byte)
	attributes["username"] = []byte("vojha24")
	attributes["role"] = []byte("client")

	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	_, err := stub.MockInvoke("t123", "CreateLoanApplication", []string{loanApplicationID, loanApplication})
	if err == nil {
		t.Fatalf("Expected unauthorized user error to be returned")
	}

}

func TestInvokeValidation2(t *testing.T) {
	fmt.Println("Entering TestInvokeValidation2")

	attributes := make(map[string][]byte)
	attributes["username"] = []byte("vojha24")
	attributes["role"] = []byte("Bank_Admin")

	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	_, err := stub.MockInvoke("t123", "CreateLoanApplication", []string{loanApplicationID, loanApplication})
	if err != nil {
		fmt.Println(err)
		t.Fatalf("Expected CreateLoanApplication to be invoked")
	}

}

func TestInvokeFunctionValidation(t *testing.T) {
	fmt.Println("Entering TestInvokeFunctionValidation")

	attributes := make(map[string][]byte)
	attributes["username"] = []byte("vojha24")
	attributes["role"] = []byte("Bank_Admin")

	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	_, err := stub.MockInvoke("t123", "InvalidFunctionName", []string{})
	if err == nil {
		t.Fatalf("Expected invalid function name error")
	}

}

func TestInvokeFunctionValidation2(t *testing.T) {
	fmt.Println("Entering TestInvokeFunctionValidation2")

	attributes := make(map[string][]byte)
	attributes["username"] = []byte("vojha24")
	attributes["role"] = []byte("Bank_Admin")

	stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
	if stub == nil {
		t.Fatalf("MockStub creation failed")
	}

	bytes, err := stub.MockInvoke("t123", "CreateLoanApplication", []string{loanApplicationID, loanApplication})
	if err != nil {
		t.Fatalf("Expected CreateLoanApplication function to be invoked")
	}
	//A spy could have been used here to ensure CreateLoanApplication method actually got invoked.
	var la LoanApplication
	err = json.Unmarshal(bytes, &la)
	if err != nil {
		t.Fatalf("Expected valid loan application JSON string to be returned from CreateLoanApplication method")
	}

}

func TestNonDeterministicFunction(t *testing.T) {
	fmt.Println("Entering TestNonDeterministicFunction")
	attributes := make(map[string][]byte)

	const peerSize = 4
	var stubs [peerSize]*shim.CustomMockStub
	var responses [peerSize][]byte
	var loanApplicationCustom = `{"propertyId":"prop1","landId":"land1","permitId":"permit1","buyerId":"vojha24","personalInfo":{"firstname":"Varun","lastname":"Ojha","dob":"dob","email":"varun@gmail.com","mobile":"99999999"},"financialInfo":{"monthlySalary":16000,"otherExpenditure":0,"monthlyRent":4150,"monthlyLoanPayment":4000},"status":"Submitted","requestedAmount":40000,"fairMarketValue":58000,"approvedAmount":40000,"reviewedBy":"bond","lastModifiedDate":"21/09/2016 2:30pm"}`
	//Simulate execution of the chaincode function by multiple peers on their local ledgers
	for j := 0; j < peerSize; j++ {
		stub := shim.NewCustomMockStub("mockStub", new(SampleChaincode), attributes)
		if stub == nil {
			t.Fatalf("MockStub creation failed")
		}
		stub.MockTransactionStart("tx" + string(j))
		resp, err := NonDeterministicFunction(stub, []string{loanApplicationCustom})
		if err != nil {
			t.Fatalf("Could not execute NonDeterministicFunction ")
		}
		stub.MockTransactionEnd("tx" + string(j))
		stubs[j] = stub
		responses[j] = resp
	}

	for i := 0; i < peerSize; i++ {
		if i < (peerSize - 1) {
			la1Bytes, _ := stubs[i].GetState(string(responses[i]))
			la2Bytes, _ := stubs[i+1].GetState(string(responses[i+1]))
			la1 := string(la1Bytes)
			la2 := string(la2Bytes)

			fmt.Println(la1)
			fmt.Println("")
			fmt.Println(la2)

			if la1 != la2 {
				//TODO: Compare individual values to find mismatch
				t.Fatalf("Expected all loan applications to be identical. Non Deterministic chaincode error")
			}

		}
		//All loan applications retrieved from each of the peer's ledger's match. Function is deterministic

	}

}
