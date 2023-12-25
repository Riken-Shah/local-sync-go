package dir

import (
	"SyncEngine/utils"
	"errors"
	document2 "github.com/ostafen/clover/v2/document"
	"github.com/ostafen/clover/v2/query"
)

func CreateCollectionIfNotExists(syncID string) error {
	syncID += "-dir"
	if hasCollection, err := utils.DBClient.DBClient.HasCollection(syncID); err != nil {
		return err
	} else if hasCollection {
		return nil
	}

	if err := utils.DBClient.DBClient.CreateCollection(syncID); err != nil {
		return err
	}
	err := utils.DBClient.DBClient.CreateIndex(syncID, string(Path))
	if err != nil {
		return err
	}
	return nil
}

func toDocuments(files []Dir) ([]*document2.Document, error) {
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

func InsertMany(syncID string, files []Dir) error {
	syncID += "-dir"

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
	syncID += "-dir"

	if documents, err := utils.DBClient.DBClient.FindAll(query.NewQuery(syncID)); err != nil {
		return nil, err
	} else {
		return documents, err
	}
}
