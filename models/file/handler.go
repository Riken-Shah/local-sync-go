package file

import (
	"SyncEngine/utils"
	"errors"
	document2 "github.com/ostafen/clover/v2/document"
	"github.com/ostafen/clover/v2/query"
	"log"
)

func CreateCollectionIfNotExists(syncID string) error {
	if hasCollection, err := utils.DBClient.DBClient.HasCollection(syncID); err != nil {
		return err
	} else if hasCollection {
		return nil
	}

	if err := utils.DBClient.DBClient.CreateCollection(syncID); err != nil {
		return err
	}
	err := utils.DBClient.DBClient.CreateIndex(syncID, string(FilePath))
	if err != nil {
		return err
	}
	return nil
}

func toDocuments(files []File) ([]*document2.Document, error) {
	var docs = make([]*document2.Document, len(files))
	for index, file := range files {
		if doc := document2.NewDocumentOf(file); doc == nil {
			return docs, errors.New("unable to parse to document")
		} else {
			docs[index] = doc
		}
	}
	return docs, nil
}

func InsertMany(syncID string, files []File) error {
	if docs, err := toDocuments(files); err != nil {
		return err
	} else {
		if err := utils.DBClient.DBClient.Insert(syncID, docs...); err != nil {
			return err
		}
	}
	return nil
}

func FetchAll(syncID string) ([]*document2.Document, error) {
	if documents, err := utils.DBClient.DBClient.FindAll(query.NewQuery(syncID)); err != nil {
		return nil, err
	} else {
		return documents, err
	}
}

func FetchAllForGeneratingThumbnails(syncID string) ([]*document2.Document, error) {
	if documents, err := utils.DBClient.DBClient.FindAll(query.NewQuery(syncID).Where(query.Field(string(ThumbnailGenerated)).Eq(false))); err != nil {
		return nil, err
	} else {
		return documents, err
	}
}

func FetchAllForGeneratingEmbedding(syncID string, skip, limit int) ([]*document2.Document, error) {
	if documents, err := utils.DBClient.DBClient.FindAll(query.NewQuery(syncID).Where(query.Field(string(SyncedToVectorDB)).Eq(false)).Skip(skip).Limit(limit)); err != nil {
		return nil, err
	} else {
		return documents, err
	}
}

type Row struct {
	ThumbnailPath string                 `json:"thumbnail_path"`
	Metadata      map[string]interface{} `json:"metadata"`
}

func DocumentsToRow(documents []*document2.Document) []Row {
	var rows = make([]Row, 0)
	for _, doc := range documents {
		filePath, ok := doc.Get(string(FilePath)).(string)
		if !ok {
			log.Println("err converting to row: (filePath) ", doc.AsMap())
			continue
		}
		lastSynced, ok := doc.Get(string(LastSynced)).(int64)
		if !ok {
			log.Println("err converting to row: (lastSynced)", doc.AsMap())
			continue
		}
		thumbnailPath, ok := doc.Get(string(ThumbnailPath)).(string)
		if !ok {
			log.Println("err converting to row:(thumbnailPath) ", doc.AsMap())
			continue
		}
		row := Row{}
		row.ThumbnailPath = thumbnailPath
		row.Metadata = map[string]interface{}{
			string(LastSynced): lastSynced,
			string(FilePath):   filePath,
		}

		rows = append(rows, row)
	}
	return rows
}
