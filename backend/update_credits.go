package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"voice-clone-backend/config"
	"voice-clone-backend/database"
	"voice-clone-backend/models"
)

func main() {
	// Parse command line arguments
	email := flag.String("email", "", "User email")
	credits := flag.Int("credits", 0, "Credits to set")
	flag.Parse()

	if *email == "" {
		fmt.Println("Usage: go run update_credits.go -email <email> -credits <credits>")
		os.Exit(1)
	}

	// Load config
	config.LoadConfig()

	// Init database
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to init database: %v", err)
	}

	var user models.User
	result := database.DB.Where("email = ?", *email).First(&user)
	if result.Error != nil {
		log.Fatalf("User not found: %v", result.Error)
	}

	result = database.DB.Model(&user).Update("credits", *credits)
	if result.Error != nil {
		log.Fatalf("Failed to update credits: %v", result.Error)
	}

	fmt.Printf("✅ Successfully updated credits for %s to %d\n", *email, *credits)
}
