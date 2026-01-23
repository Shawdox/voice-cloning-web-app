package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
	password := "admin123"

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err == nil {
		fmt.Println("Password matches!")
	} else {
		fmt.Printf("Password does not match: %v\n", err)
	}

	// Generate a new hash for comparison
	newHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Error generating hash: %v\n", err)
	} else {
		fmt.Printf("New hash: %s\n", string(newHash))
	}
}
