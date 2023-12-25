package file

type File struct {
	FilePath           string `clover:"file_path"`
	LastSynced         int64  `clover:"last_synced"`
	ThumbnailGenerated bool   `clover:"thumbnail_generated"`
	ThumbnailPath      string `clover:"thumbnail_path"`
	SyncedToVectorDB   bool   `clover:"synced_to_vector_db"`
}

type Column string

var (
	FilePath           Column = "file_path"
	LastSynced         Column = "last_synced"
	ThumbnailGenerated Column = "thumbnail_generated"
	ThumbnailPath      Column = "thumbnail_path"
	SyncedToVectorDB   Column = "synced_to_vector_db"
)

var AllColumn []Column = []Column{FilePath, LastSynced, ThumbnailGenerated, SyncedToVectorDB, ThumbnailPath}
