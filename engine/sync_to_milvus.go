package engine

import (
	"SyncEngine/models/file"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/kshedden/gonpy"
	"github.com/milvus-io/milvus-sdk-go/v2/client"
	"github.com/milvus-io/milvus-sdk-go/v2/entity"
)

type Metadata struct {
	Width     string `json:"width"`
	Height    string `json:"height"`
	Format    string `json:"format"`
	Thumbnail string `json:"thumbnail"`
}

func SyncMilvus(syncID, URI, username, password, collectionName, embFolderPath string) error {
	ctx := context.Background()
	// create grpc client that tls is enabled
	c, err := client.NewDefaultGrpcClientWithURI(
		ctx,
		URI,
		username,
		password,
	)
	if err != nil {
		log.Fatal("failed to connect:", err)
	}

	has, err := c.HasCollection(ctx, collectionName)
	if err != nil {
		log.Fatal("failed to check whether collection exists:", err.Error())
	}
	if !has {
		// collection with same name exist, clean up mess
		// define collection schema, see film.csv
		schema := &entity.Schema{
			CollectionName: collectionName,
			Description:    "this is the example collection for insert and search",
			AutoID:         false,
			Fields: []*entity.Field{
				{
					Name:     "fname",
					DataType: entity.FieldTypeVarChar,
					TypeParams: map[string]string{
						entity.TypeParamMaxLength: "512",
					},
					PrimaryKey: true,
					AutoID:     false,
				},
				{
					Name:     "embedding",
					DataType: entity.FieldTypeFloatVector,
					TypeParams: map[string]string{
						entity.TypeParamDim: "512",
					},
				},
				{
					Name:     "metadata",
					DataType: entity.FieldTypeJSON,
				},
			},
		}
		err = c.CreateCollection(ctx, schema, 1) // only 1 shard
		if err != nil {
			log.Fatal("failed to create collection:", err.Error())
		}

		// Now add index
		idx, err := entity.NewIndexIvfFlat(entity.L2, 16384)
		if err != nil {
			log.Fatal("fail to create ivf flat index:", err.Error())
		}
		err = c.CreateIndex(ctx, collectionName, "embedding", idx, false)
		if err != nil {
			log.Fatal("fail to create index:", err.Error())
		}
	}

	var limit = 30000
	var skip = 0
	var recordsFound = 100001

	for recordsFound >= limit {
		docs, err := file.FetchAllForSync(syncID, skip, limit)
		if err != nil {
			log.Printf("Something went wrong while fetching docs, err: %v\n", err)
			break
		}
		recordsFound = len(docs)
		skip += limit

		fnames := make([]string, 0)
		embds := make([][]float32, 0)
		metadata := make([][]byte, 0)

		fmt.Println("total docs found: ", len(docs))

		for _, doc := range docs {
			// Create output file path for JPEG
			hasher := sha1.New()
			hasher.Write([]byte(doc.FilePath))
			hash := hex.EncodeToString(hasher.Sum(nil))
			outputPath := filepath.Join(embFolderPath, hash+".npy")

			// Only add if embedding exists
			if _, err := os.Stat(outputPath); err == nil {
				m := Metadata{Format: filepath.Ext(doc.FilePath)[1:]}
				r, err := gonpy.NewFileReader(outputPath)
				if err != nil {
					log.Printf("error reading .npy for %s err: %v\n", doc.FilePath, err)
					continue
				}
				data, err := r.GetFloat32()
				if err != nil {
					log.Printf("error reading data from npy for %s err: %v\n", doc.FilePath, err)
					continue
				}
				jsonByes, err := json.Marshal(m)
				if err != nil {
					log.Printf("error json marshling for %s err: %v\n", doc.FilePath, err)
					continue
				}
				fnames = append(fnames, doc.FilePath)
				metadata = append(metadata, jsonByes)
				embds = append(embds, data)
			}
		}

		fnameCol := entity.NewColumnVarChar("fname", fnames)
		metadataCol := entity.NewColumnJSONBytes("metadata", metadata)
		embCol := entity.NewColumnFloatVector("embedding", 512, embds)

		log.Println("fname: ", len(fnames), "meta: ", len(metadata), "em: ", len(embds))
		if len(fnames) == 0 {
			continue
		}
		// insert into default partition
		_, err = c.Upsert(ctx, collectionName, "", fnameCol, metadataCol, embCol)
		if err != nil {
			log.Fatal("failed to insert film data:", err.Error())
		}
		log.Println("insert completed")
		ctx, cancel := context.WithTimeout(context.Background(), time.Second*250)
		defer cancel()
		err = c.Flush(ctx, collectionName, false)
		if err != nil {
			log.Fatal("failed to flush collection:", err.Error())
		}
		log.Println("flush completed")

		err = file.ThumbnailEmbeddingCompleted(fnames)
		if err != nil {
			log.Printf("something went wrong while marking emb completed, err: %v", err)
			return err
		}
	}
	return nil
}
