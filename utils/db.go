package utils

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"sync"
)

type DBHandler struct {
	DBClient *sql.DB
}

var dbOnce sync.Once
var dbPath = filepath.Join(".local", "db2")
var DBClient DBHandler

func init() {
	// Connect to CloverDB
	dbOnce.Do(func() {
		err := os.Mkdir(dbPath, os.ModePerm)
		if err != nil {
			log.Println("Error creating dir: ", err)
		}
		//dbClientInst, err := cloverdb.Open(dbPath)
		//if err != nil {
		//	log.Fatal("Error opening CloverDB:", err)
		//	return
		//}

		dbClientInst, err := sql.Open("sqlite3", filepath.Join(dbPath, "foo.db"))
		if err != nil {
			log.Fatal(err)
		}

		log.Println("DBClient connection established")
		DBClient.DBClient = dbClientInst
	})
}
