package syncs

import (
	"SyncEngine/utils"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var collectionName = "syncs"

func CreateCollectionIfNotExists() error {
	_, err := utils.DBClient.DBClient.Exec(`
		CREATE TABLE IF NOT EXISTS syncs (
			id TEXT PRIMARY KEY,
			file_path TEXT,
			last_synced_on INTEGER,
			dir_scanned BOOLEAN DEFAULT false
		);`)
	return err
}

func CreateSyncProcessIfNotExists(filePath string) (Sync, error) {
	sync := Sync{}

	rows, err := utils.DBClient.DBClient.Query(`SELECT * FROM syncs`, collectionName)
	if err != nil {
		return sync, err
	}
	defer rows.Close()

	if !rows.Next() {
		sync.ID = "files" //  uuid.New().String()
		sync.FilePath = filePath
		sync.LastSyncedOn = time.Now().Unix()

		_, err := utils.DBClient.DBClient.Exec("INSERT INTO syncs (id, file_path, last_synced_on) VALUES (?, ?, ?);", sync.ID, sync.FilePath, sync.LastSyncedOn)
		if err != nil {
			return sync, err
		}
		//lastInsertID, _ := result.LastInsertId()
		//sync.ID = lastInsertID
	} else {
		err = rows.Scan(&sync.ID, &sync.FilePath, &sync.LastSyncedOn, &sync.DirScanned)
		if err != nil {
			return sync, err
		}
	}

	return sync, nil
}

func DirScannedCompleted(syncID string) error {
	_, err := utils.DBClient.DBClient.Exec(`UPDATE syncs SET dir_scanned = true WHERE id = ?;`, syncID)
	return err
}
