package syncs

type Sync struct {
	ID           string `db:"id"`
	FilePath     string `db:"file_path"`
	LastSyncedOn int64  `db:"last_synced_on"`
	DirScanned   bool   `db:"dir_scanned"`
}

type Column string

var (
	FilePath     Column = "file_path"
	LastSyncedOn Column = "last_synced_on"
	DirScanned   Column = "dir_scanned"
)
