package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type SampleChaincode struct {
}

type PersonalInfo struct {
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	DOB       string `json:"DOB"`
	Email     string `json:"email"`
	Mobile    string `json:"mobile"`
}

type FinancialInfo struct {
	MonthlySalary      int `json:"monthlySalary"`
	MonthlyRent        int `json:"monthlyRent"`
	OtherExpenditure   int `json:"otherExpenditure"`
	MonthlyLoanPayment int `json:"monthlyLoanPayment"`
}

type LoanApplication struct {
	ID                     string        `json:"id"`
	PropertyId             string        `json:"propertyId"`
	LandId                 string        `json:"landId"`
	PermitId               string        `json:"permitId"`
	BuyerId                string        `json:"buyerId"`
	AppraisalApplicationId string        `json:"appraiserApplicationId"`
	SalesContractId        string        `json:"salesContractId"`
	PersonalInfo           PersonalInfo  `json:"personalInfo"`
	FinancialInfo          FinancialInfo `json:"financialInfo"`
	Status                 string        `json:"status"`
	RequestedAmount        int           `json:"requestedAmount"`
	FairMarketValue        int           `json:"fairMarketValue"`
	ApprovedAmount         int           `json:"approvedAmount"`
	ReviewerId             string        `json:"reviewerId"`
	LastModifiedDate       string        `json:"lastModifiedDate"`
}

func CreateLoanApplication(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println("Entering CreateLoanApplication")

	if len(args) < 2 {
		fmt.Println("Invalid number of args")
		return nil, errors.New("Expected atleast two arguments for loan application creation")
	}

	var loanApplicationId = args[0]
	var loanApplicationInput = args[1]
	//TODO: Include schema validation here

	err := stub.PutState(loanApplicationId, []byte(loanApplicationInput))
	if err != nil {
		fmt.Println("Could not save loan application to ledger", err)
		return nil, err
	}

	fmt.Println("Successfully saved loan application")
	return []byte(loanApplicationInput), nil

}

func NonDeterministicFunction(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	fmt.Println("Entering NonDeterministicFunction")
	//Use random number generator to generate the ID
	var random = rand.New(rand.NewSource(time.Now().UnixNano()))
	var loanApplicationID = "la1" + strconv.Itoa(random.Intn(1000))
	var loanApplication = args[0]
	var la LoanApplication
	err := json.Unmarshal([]byte(loanApplication), &la)
	if err != nil {
		fmt.Println("Could not unmarshal loan application", err)
		return nil, err
	}
	la.ID = loanApplicationID
	laBytes, err := json.Marshal(&la)
	if err != nil {
		fmt.Println("Could not marshal loan application", err)
		return nil, err
	}
	err = stub.PutState(loanApplicationID, laBytes)
	if err != nil {
		fmt.Println("Could not save loan application to ledger", err)
		return nil, err
	}

	fmt.Println("Successfully saved loan application")
	return []byte(loanApplicationID), nil
}

func (t *SampleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return nil, nil
}

func (t *SampleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return nil, nil
}

func (t *SampleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("Entering Invoke")

	ubytes, _ := stub.ReadCertAttribute("username")
	rbytes, _ := stub.ReadCertAttribute("role")

	username := string(ubytes)
	role := string(rbytes)

	if role != "Bank_Admin" {
		return nil, errors.New("caller with " + username + " and role " + role + " does not have access to invoke CreateLoanApplication")
	}
	if function == "CreateLoanApplication" {
		return CreateLoanApplication(stub, args)
	}
	return nil, errors.New("Invalid function name")
}
