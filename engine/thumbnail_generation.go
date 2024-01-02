package engine

import (
	f2 "SyncEngine/models/file"
	"SyncEngine/utils"
	"fmt"
	"github.com/ostafen/clover/v2/query"
	_ "golang.org/x/image/bmp"
	_ "golang.org/x/image/tiff"
	_ "image/png"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

type Result struct {
	SrcPath  string
	SavePath string
	Errors   []error
}

func generateThumbnail(collectionName string, fpaths []string, thumbnailPath string, wg *sync.WaitGroup) {
	defer wg.Done()

	//var errors []error
	//var limit = 1000
	args := []string{}
	args = append(args, fpaths...)
	mydir, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
	}
	outpath := filepath.Join(mydir, thumbnailPath, "%s.jpeg")
	//fmt.Println("outpath", outpath)
	args = append(args, []string{"--size", "512x512", "-o", outpath, "--vips-concurrency", "8"}...)
	cmd := exec.Command("vipsthumbnail", args...)
	//var stdoutBuf, stderrBuf bytes.Buffer

	//cmd.Stdout = io.MultiWriter(os.Stdout, &stdoutBuf)
	//cmd.Stderr = io.MultiWriter(os.Stderr, &stderrBuf)
	fmt.Println("starting the commdn")
	st := time.Now()
	if _, err := cmd.CombinedOutput(); err != nil {
		log.Printf("err in running", err)
		return
	}
	//err := cmd.Start()
	//if err != nil {
	//	fmt.Println("err: ", err)
	//	return
	//}
	//
	//if err := cmd.Wait(); err != nil {
	//	fmt.Println("err: ", err)
	//	return
	//}

	fmt.Println("total time: ", time.Since(st))

	fpathsI := []interface{}{}
	for _, fpath := range fpaths {
		fpathsI = append(fpathsI, fpath)

	}
	if err := utils.DBClient.DBClient.Update(query.NewQuery(collectionName).Where(query.Field(string(f2.FilePath)).In(fpathsI...)), map[string]interface {
	}{
		string(f2.ThumbnailGenerated): true,
		string(f2.ThumbnailPath):      thumbnailPath,
	}); err != nil {
		log.Printf("Something went wrong while updating thubmnail: %v, err: %v", fpaths, err)
	}

	//
	//for _, fpath := range fpaths {
	//	//file, err := os.Open(fpath)
	//	//if fpath == "" {
	//	//	continue
	//	//}
	//
	//	//if err != nil {
	//	//	errors = append(errors, fmt.Errorf("Error opening file %s: %v", fpath, err))
	//	//	continue
	//	//}
	//	////defer file.Close()
	//	//
	//	//img, _, err := image.Decode(file)
	//	//if err != nil {
	//	//	errors = append(errors, fmt.Errorf("Error decoding image %s: %v", fpath, err))
	//	//	continue
	//	//}
	//	//
	//	//// Resize image to 512x512
	//	//thumbnail := resize.Thumbnail(512, 512, img, resize.Lanczos3)
	//	//
	//	//// Create output file path for JPEG
	//	//hasher := sha1.New()
	//	//hasher.Write([]byte(fpath))
	//	//hash := hex.EncodeToString(hasher.Sum(nil))
	//	//outputPath := filepath.Join(thumbnailPath, filepath.Base(fpath)+".jpeg")
	//	//err = os.MkdirAll(outputPath, os.ModePerm)
	//	//if err != nil {
	//	//	errors = append(errors, fmt.Errorf("Error creating output file path %s: %v", outputPath, err))
	//	//	continue
	//	//}
	//	//outputPath = filepath.Join(outputPath, "thumbnail_"+filepath.Base(fpath)+".jpeg")
	//
	//	//outFile, err := os.Create(outputPath)
	//	//if err != nil {
	//	//	errors = append(errors, fmt.Errorf("Error creating output file %s: %v", outputPath, err))
	//	//	continue
	//	//}
	//	////defer outFile.Close()
	//	//
	//	//// Encode and save the thumbnail as JPEG
	//	//err = jpeg.Encode(outFile, thumbnail, nil)
	//	//if err != nil {
	//	//	errors = append(errors, fmt.Errorf("Error encoding image %s: %v", outputPath, err))
	//	//	continue
	//	//}
	//	//outFile.Close()
	//	//file.Close()
	//	//
	//	//savedFpaths = append(savedFpaths, fpath)
	//
	//	// Send success result
	//	//resultChan <- Result{SavePath: outputPath, Errors: nil, SrcPath: fpath}
	//	//go func(fpath, outPath string) {
	//	//if err := utils.DBClient.DBClient.Update(query.NewQuery(collectionName).Where(query.Field(string(f2.FilePath)).Eq(fpath)), map[string]interface {
	//	//}{
	//	//	string(f2.ThumbnailGenerated): true,
	//	//	string(f2.ThumbnailPath):      outputPath,
	//	//}); err != nil {
	//	//	log.Printf("Something went wrong while updating thubmnail: %v, err: %v", fpaths, err)
	//	//}
	//	//}(fpath, outputPath)
	//}

	//// Send success result
	//resultChan <- Result{Errors: nil, SrcPath: "", SavePath: ""}

	// Send accumulated errors
	//if len(errors) > 0 {
	//	resultChan <- Result{SavePath: "", Errors: errors, SrcPath: ""}
	//	errors = []error{}
	//}
}

func GenerateThumbnails(collectionName string, thumbnailPath string) error {
	defer utils.Timer("thumbnail")()

	if fileDocs, err := f2.FetchAllForGeneratingThumbnails(collectionName); err != nil {
		return err
	} else {
		filePaths := make([]string, 0)
		for _, doc := range fileDocs {
			filePaths = append(filePaths, doc.Get(string(f2.FilePath)).(string))
		}

		// Set the number of workers (goroutines)
		//numWorkers := 100

		log.Printf("Total %d files found for thumbnail generation\n", len(filePaths))

		// Create a WaitGroup to wait for all goroutines to finish
		var wg sync.WaitGroup

		// Create a buffered channel to collect results
		//resultChan := make(chan Result, len(filePaths))

		// Ensure the "thumbnail" directory exists
		if err := os.MkdirAll(thumbnailPath, os.ModePerm); err != nil {
			return err
		}

		// Split the images into chunks for parallel processing
		//chunkSize := (len(filePaths) + numWorkers - 1) / numWorkers
		//for i := 0; i < len(filePaths); i += chunkSize {
		//	wg.Add(1)
		//
		//	end := i + chunkSize
		//	if end > len(filePaths) {
		//		end = len(filePaths)
		//	}
		//	go generateThumbnail(collectionName, filePaths[i:end], thumbnailPath, resultChan, &wg)
		//}
		chunkSize := 1000
		maxChunks := 10 * chunkSize
		for i := 0; i < len(filePaths); i += chunkSize {
			if i%maxChunks == 0 && i > 0 {
				fmt.Println("wating 5555")
				wg.Wait()
				wg = sync.WaitGroup{}
			}
			wg.Add(1)
			end := i + chunkSize
			if end > len(filePaths) {
				end = len(filePaths)
			}
			go generateThumbnail(collectionName, filePaths[i:end], thumbnailPath, &wg)
		}

		//go generateThumbnail(imagePaths, resultChan, &wg)

		wg.Wait()
		//close(resultChan)
		// Close the result channel once all workers are done
		//go func() {
		//	wg.Wait()
		//	close(resultChan)
		//}()

		// Print results

		//i := 0
		//st := time.Now()
		//for result := range resultChan {
		//	if len(result.Errors) > 0 {
		//		for _, err := range result.Errors {
		//			log.Printf("Error processing %s: %v\n", result.SrcPath, err)
		//		}
		//	} else {
		//		i += 1
		//		fmt.Printf("saved %d thumbnails\n", i)
		//		if i%1000 == 0 {
		//			msg := fmt.Sprintf("generated 1000 thumbnails in %v, total: %d", time.Since(st), i)
		//			fmt.Println(msg)
		//			log.Println(msg)
		//			st = time.Now()
		//		}
		//	}
		//}
		//log.Println("Total file saved", i)
	}
	return nil
}

//func main() {
//
//	// Assuming DBClient.DBClient is a valid database client
//	docs, _ := DBClient.DBClient.Query("p0").FindAll()
//
//	imagePaths := []string{}
//	for _, doc := range docs {
//		fpath := doc.Get("fpath")
//		imagePaths = append(imagePaths, fpath.(string))
//	}
//
//}
