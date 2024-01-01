package syncs

import (
	"SyncEngine/utils"
	"errors"
	document2 "github.com/ostafen/clover/v2/document"
	"github.com/ostafen/clover/v2/query"
	"time"
)

var collectionName = "syncs"

func CreateCollectionIfNotExists() error {
	if hasSyncs, err := utils.DBClient.DBClient.HasCollection(collectionName); err != nil {
		return err
	} else if !hasSyncs {
		if err := utils.DBClient.DBClient.CreateCollection(collectionName); err != nil {
			return err
		}
	}
	return nil
}

func CreateSyncProcessIfNotExists(filePath string) (Sync, error) {
	sync := Sync{}

	if docs, err := utils.DBClient.DBClient.FindAll(query.NewQuery(collectionName)); err != nil {
		return sync, err
	} else {
		if len(docs) == 0 {
			sync.FilePath = filePath
			sync.LastSyncedOn = time.Now().Unix()
			doc := document2.NewDocumentOf(sync)

			if doc == nil {
				return sync, errors.New("failed to create document from syncs object")
			}

			if _, err2 := utils.DBClient.DBClient.InsertOne(collectionName, doc); err2 != nil {
				return sync, err2
			}
			sync.ID = doc.ObjectId()

		} else if len(docs) == 1 {
			//if docs[0].Get(string(FilePath)) != filePath {
			//	return sync, errors.New("file path has been changed, this case is not handled yet")
			//}

			sync.ID = docs[0].ObjectId()
			sync.FilePath = docs[0].Get(string(FilePath)).(string)
			sync.LastSyncedOn = docs[0].Get(string(LastSyncedOn)).(int64)
			sync.DirScanned = docs[0].Get(string(DirScanned)).(bool)
		} else {
			return sync, errors.New("more than one syncs found in syncs collection")
		}
	}
	return sync, nil
}

func DirScannedCompleted(syncID string) error {
	if err := utils.DBClient.DBClient.UpdateById(collectionName, syncID, func(doc *document2.Document) *document2.Document {
		doc.Set(string(DirScanned), true)
		return doc
	}); err != nil {
		return err
	}
	return nil
}
