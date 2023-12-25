package utils

import (
	cloverdb "github.com/ostafen/clover/v2"
	"log"
	"os"
	"sync"
)

type DBHandler struct {
	DBClient *cloverdb.DB
}

var dbOnce sync.Once
var dbPath = ".local/db"
var DBClient DBHandler

func init() {
	// Connect to CloverDB
	dbOnce.Do(func() {
		err := os.Mkdir(dbPath, os.ModePerm)
		if err != nil {
			log.Println("Error creating dir: ", err)
		}
		dbClientInst, err := cloverdb.Open(dbPath)
		if err != nil {
			log.Fatal("Error opening CloverDB:", err)
			return
		}
		log.Println("DBClient connection established")
		DBClient.DBClient = dbClientInst
	})
}

func (db *DBHandler) RecreateCollection(collectionName string) error {
	if found, err := db.DBClient.HasCollection(collectionName); err == nil && found {
		if err := db.DBClient.DropCollection(collectionName); err != nil {
			return err
		} else if err != nil {
			return err
		}
	}
	if err := db.DBClient.CreateCollection(collectionName); err != nil {
		return err
	}
	return nil
}
