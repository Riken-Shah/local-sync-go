package engine

import (
	"SyncEngine/models/dir"
	"SyncEngine/models/file"
	"SyncEngine/models/syncs"
	"log"
)

var SyncProcess = syncs.Sync{}

func Init(rootFilePath string) error {
	if err := syncs.CreateCollectionIfNotExists(); err != nil {
		return err
	}

	if sync, err := syncs.CreateSyncProcessIfNotExists(rootFilePath); err != nil {
		return err
	} else {
		SyncProcess = sync
	}
	return nil
}

func BeginOrResume(rootFilePath string) error {
	if err := file.CreateCollectionIfNotExists(SyncProcess.ID); err != nil {
		return err
	}
	if err := dir.CreateCollectionIfNotExists(SyncProcess.ID); err != nil {
		return err
	}

	if files, err := dir.FetchAll(SyncProcess.ID); err != nil {
		return err
	} else {
		filePathsExits := map[string]bool{}
		for _, document := range files {
			filePathsExits[document.Get(string(dir.Path)).(string)] = true

		}
		log.Println("------- Processing Dirs --------")
		ProcessDirs(rootFilePath, SyncProcess.ID, filePathsExits)
		log.Println("------- Processing Dirs Completed --------")
		log.Println("------- Generate Thumbnails --------")
		err := GenerateThumbnails(SyncProcess.ID, ".local/thumbnails")
		if err != nil {
			return err
		}
		log.Println("------- Generate Thumbnails Completed --------")

		log.Println("------- All Process Completed --------")
	}

	return nil
}
