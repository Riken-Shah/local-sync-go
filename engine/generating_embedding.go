package engine

import (
	f2 "SyncEngine/models/file"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

func GenerateEmbeddings(syncID, collectionName, milvusURI, milvusUsername, milvusPassword, cacheDir string) error {
	shouldContinue := true
	skip := 0
	limit := 500000

	var stdoutBuf, stderrBuf bytes.Buffer

	for shouldContinue {
		documents, err := f2.FetchAllForGeneratingEmbedding(syncID, skip, limit)
		if err != nil {
			return err
		}

		if len(documents) < limit {
			shouldContinue = false
		}

		rows := f2.DocumentsToRow(documents)
		jsonString, _ := json.Marshal(rows)
		tempJSONFilePath := filepath.Join(".local", "temp.json")
		err = os.WriteFile(tempJSONFilePath, jsonString, os.ModePerm)
		if err != nil {
			return err
		}
		args := []string{"scripts/sync.py", "--json-file", tempJSONFilePath, "--collection-name", collectionName, "--cache-dir", cacheDir}
		milvusArgs := []string{"--milvus-uri", milvusURI, "--milvus-username", milvusUsername, "--milvus-password", milvusPassword}
		args = append(args, milvusArgs...)
		cmd := exec.Command("python", args...)

		cmd.Stdout = io.MultiWriter(os.Stdout, &stdoutBuf)
		cmd.Stderr = io.MultiWriter(os.Stderr, &stderrBuf)

		err = cmd.Start()

		if err != nil {
			fmt.Printf(err.Error())
		}

		err = cmd.Wait()
		if err != nil {
			return err
		}

		//for _, doc := range documents {
		//	doc.Set(string(f2.SyncedToVectorDB), true)
		//	err := utils.DBClient.DBClient.Save(syncID, doc)
		//	if err != nil {
		//		return err
		//	}
		//}

		log.Printf("dumped %d files to milvus\n", len(documents))

	}
	return nil
}
