package engine

import (
	"SyncEngine/models/dir"
	"SyncEngine/models/file"
	"SyncEngine/models/syncs"
	ini "gopkg.in/ini.v1"
	"log"
	"path/filepath"
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
	config, err := ini.Load("config.ini")
	if err != nil {
		log.Printf("Fail to read config.ini file: %v", err)
		return err
	}

	milvus, err := config.NewSection("milvus")
	if err != nil {
		log.Printf("Fail to read milvus in config.ini file: %v", err)
		return err
	}
	milvusUri := milvus.Key("uri").String()
	milvusUsername := milvus.Key("user").String()
	milvusPassword := milvus.Key("password").String()
	collectionMName := milvus.Key("collection").String()

	if err := file.CreateCollectionIfNotExists(SyncProcess.ID); err != nil {
		return err
	}
	if err := dir.CreateCollectionIfNotExists(SyncProcess.ID); err != nil {
		return err
	}

	if !SyncProcess.DirScanned {
		if files, err := dir.FetchAll(SyncProcess.ID); err != nil {
			return err
		} else {
			filePathsExits := map[string]bool{}
			for _, document := range files {
				filePathsExits[document.Get(string(dir.Path)).(string)] = true

			}
			log.Println("------- Processing Dirs --------")
			ProcessDirs(rootFilePath, SyncProcess.ID, filePathsExits, false)
			log.Println("------- Processing Dirs Completed --------")
			err := syncs.DirScannedCompleted(SyncProcess.ID)
			if err != nil {
				return err
			}
		}
	}
	log.Println("------- Generate Thumbnails --------")
	thumbnailPath := filepath.Join(".local", "thumbnails2")
	err = GenerateThumbnails(SyncProcess.ID, thumbnailPath)
	if err != nil {
		return err
	}
	log.Println("------- Generate Thumbnails Completed --------")
	log.Println("------- Generate Embeddings --------")
	cacheFolder := filepath.Join(".cache")
	err = GenerateEmbeddings(SyncProcess.ID, collectionMName, milvusUri, milvusUsername, milvusPassword, cacheFolder)
	if err != nil {
		return err
	}
	log.Println("------- Generate Embeddings Completed --------")
	log.Println("------- All Process Completed --------")

	return nil
}
