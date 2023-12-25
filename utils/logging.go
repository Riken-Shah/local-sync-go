package utils

import (
	"log"
	"os"
	"sync"
	"time"
)

var fileOpenOnce = sync.Once{}
var logfilePath = ".local/logs/"

func SetupLogs() {
	//fileOpenOnce.Do(func() {
	err := os.Mkdir(logfilePath, os.ModePerm)
	if err != nil {
		return
	}
	logfilePath += time.Now().Format("2006-01-02-15:04:05") + ".log"
	logFile, err := os.OpenFile(logfilePath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("Error opening logfile: ", err)
	}
	log.SetOutput(logFile)
	log.SetFlags(log.LstdFlags | log.Lshortfile | log.Lmicroseconds)
	//})
}
