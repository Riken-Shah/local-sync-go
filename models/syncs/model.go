package syncs

type Sync struct {
	ID           string `clover:"id"`
	FilePath     string `clover:"file_path"`
	LastSyncedOn int64  `clover:"last_synced_on"`
}

type Column string

var (
	FilePath     Column = "file_path"
	LastSyncedOn Column = "last_synced_on"
)
