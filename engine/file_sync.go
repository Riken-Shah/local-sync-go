package engine

import (
	"SyncEngine/models/dir"
	"SyncEngine/models/file"
	"SyncEngine/utils"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

var (
	maxSliceLength      = 10000
	filePaths           []file.File
	newDirsTravelled    []dir.Dir
	dirAlreadyTravelled map[string]bool
	mutex               sync.Mutex
	collectionName      = "p0"
)

func isSymlink(info os.FileInfo) bool {
	return info.Mode()&os.ModeSymlink == os.ModeSymlink
}

func processFile(filePath string, wg *sync.WaitGroup) {
	defer wg.Done()

	// Check file extensions here
	if strings.HasSuffix(filePath, ".png") || strings.HasSuffix(filePath, ".tiff") || strings.HasSuffix(filePath, ".jpg") || strings.HasSuffix(filePath, ".jpeg") {
		// Add the f path to the slice
		mutex.Lock()
		f := file.File{}
		f.FilePath = filePath
		filePaths = append(filePaths, f)
		length := len(filePaths)
		mutex.Unlock()

		// Dump to CloverDB if the slice reaches a certain length
		if length >= maxSliceLength {
			dumpToCloverDB()
		}
	}
}

func walkDir(rootDir string, wg *sync.WaitGroup) {
	defer wg.Done()
	filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Println("error while walking dir: ", path, err)
			return nil
		}

		_, exists := dirAlreadyTravelled[path]
		if exists {
			return nil
		}

		// Skip symbolic links
		if isSymlink(info) {
			return nil
		}

		if !info.IsDir() {
			// Process the file concurrently
			wg.Add(1)
			go processFile(path, wg)
			mutex.Lock()
			// Keeping track of d already travelled
			d := dir.Dir{}
			d.Path = path
			newDirsTravelled = append(newDirsTravelled, d)
			dirAlreadyTravelled[path] = true
			mutex.Unlock()
		}

		return nil
	})
}

func dumpToCloverDB() {
	mutex.Lock()
	defer mutex.Unlock()

	//// Insert file paths into CloverDB
	file.InsertMany(collectionName, filePaths)
	dir.InsertMany(collectionName, newDirsTravelled)

	log.Printf("Flushed files %d to %s\n", len(filePaths), collectionName)

	// Clear the slice
	filePaths = nil
	newDirsTravelled = []dir.Dir{}
}

func ProcessDirs(rootFilePath, collection string, filePathsSynced map[string]bool) {
	collectionName = collection
	dirAlreadyTravelled = filePathsSynced
	defer utils.Timer("process dir")()
	var wg sync.WaitGroup
	// Start the recursive file processing
	wg.Add(1)
	go walkDir(rootFilePath, &wg)

	// Wait for all goroutines to finish
	wg.Wait()

	// Dump any remaining file paths to CloverDB
	dumpToCloverDB()
}
