package dir

type Dir struct {
	Path       string `clover:"path"`
	LastSynced int64  `clover:"last_synced"`
}

type Column string

var (
	Path       Column = "path"
	LastSynced Column = "last_synced"
)

var AllColumn []Column = []Column{Path, LastSynced}
