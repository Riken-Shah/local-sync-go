package file

import (
	"SyncEngine/utils"
	"fmt"
	"strings"
)

func CreateCollectionIfNotExists(syncID string) error {
	// Parameterized query for creating the table
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS files (
			file_path TEXT,
			last_synced INTEGER,
			thumbnail_generated INTEGER DEFAULT 0,
			thumbnail_path TEXT,
			synced_to_vector_db INTEGER DEFAULT 0
		);`

	// Execute the parameterized query
	if _, err := utils.DBClient.DBClient.Exec(createTableQuery); err != nil {
		return fmt.Errorf("error creating table: %v", err)
	}

	// Print the SQL statement
	fmt.Println("Create table SQL:", createTableQuery)

	// Create an index for FilePath
	indexQuery := `CREATE INDEX IF NOT EXISTS idx_file_path ON files (file_path);`
	if _, err := utils.DBClient.DBClient.Exec(indexQuery); err != nil {
		return fmt.Errorf("error creating index: %v", err)
	}

	// Print the index creation SQL statement
	fmt.Println("Create index SQL:", indexQuery)

	return nil
}
func InsertMany(syncID string, files []File) error {
	// Prepare the SQL query
	query := `INSERT INTO files (file_path, last_synced, thumbnail_generated, thumbnail_path, synced_to_vector_db) VALUES `
	values := []interface{}{}

	for _, file := range files {
		query += "(?, ?, ?, ?, ?),"
		values = append(values, file.FilePath, file.LastSynced, file.ThumbnailGenerated, file.ThumbnailPath, file.SyncedToVectorDB)
	}

	// Trim the trailing comma
	query = query[:len(query)-1]

	// Execute the query
	_, err := utils.DBClient.DBClient.Exec(query, values...)
	return err
}

func FetchAllForGeneratingThumbnails(syncID string) ([]string, error) {
	q := `SELECT (file_path) FROM files  WHERE ` + string(ThumbnailGenerated) + ` = false;`
	fmt.Println(q)
	rows, err := utils.DBClient.DBClient.Query(q)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []string
	index := 0
	for rows.Next() {
		//var file File
		var file string
		err := rows.Scan(&file)
		files = append(files, file)
		index++
		if err != nil {
			return nil, err
		}
		//files = append(files, file)
	}

	return files, nil
}

func FetchAllForGeneratingEmbedding(syncID string, skip, limit int) ([]File, error) {
	q := `SELECT * FROM files  WHERE ` + string(SyncedToVectorDB) + ` = false;`
	rows, err := utils.DBClient.DBClient.Query(q)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []File
	for rows.Next() {
		var file File
		err := rows.Scan(&file.FilePath, &file.LastSynced, &file.ThumbnailGenerated, &file.ThumbnailPath, &file.SyncedToVectorDB)
		if err != nil {
			return nil, err
		}
		files = append(files, file)
	}

	return files, nil
}

type Row struct {
	ThumbnailPath string                 `json:"thumbnail_path"`
	Metadata      map[string]interface{} `json:"metadata"`
}

func DocumentsToRow(files []File) []Row {
	var rows = make([]Row, 0)
	for _, file := range files {
		row := Row{
			ThumbnailPath: file.ThumbnailPath,
			Metadata: map[string]interface{}{
				string(LastSynced): file.LastSynced,
				string(FilePath):   file.FilePath,
			},
		}
		rows = append(rows, row)
	}
	return rows
}

func ThumbnailGeneratedCompleted(filePaths []string) error {

	args := make([]interface{}, len(filePaths))
	for i, v := range filePaths {
		args[i] = v
	}

	_, err := utils.DBClient.DBClient.Exec(`UPDATE files SET thumbnail_generated = 1 WHERE file_path IN (?`+strings.Repeat(", ?", len(args)-1)+`)`, args...)
	return err
}
