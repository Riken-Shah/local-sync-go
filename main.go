package main

import (
	"SyncEngine/engine"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

var logfilePath = filepath.Join(".local", "logs")

func main() {
	//utils.SetupLogs()
	err := os.Mkdir(logfilePath, os.ModePerm)
	if err != nil {

	}
	logfilePath = filepath.Join(logfilePath, time.Now().Format("2006-01-02T15 05 05")+".log")
	fmt.Println("logfilepath", logfilePath)
	logFile, err := os.OpenFile(logfilePath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("Error opening logfile: ", err)
	}
	log.SetOutput(logFile)
	log.SetFlags(log.LstdFlags | log.Lshortfile | log.Lmicroseconds)
	defer logFile.Close()

	// Define command-line flags
	rootFilePath := flag.String("rootFilePath", "", "Path to the file")
	force := flag.Bool("force", false, "Force flag")

	// Parse command-line flags
	flag.Parse()

	// Check if rootFilePath is provided
	if *rootFilePath == "" {
		fmt.Println("Error: rootFilePath is required.")
		return
	}

	// Your logic here based on the rootFilePath and force parameters
	log.Printf("cmd args rootFilePath = %s and force = %t\n", *rootFilePath, *force)

	err = engine.Init(*rootFilePath)
	if err != nil {
		log.Fatal("error in init: ", err)
		return
	}

	if err := engine.BeginOrResume(*rootFilePath); err != nil {
		log.Fatal("err in begin or resume: ", err)
		return
	}

}
