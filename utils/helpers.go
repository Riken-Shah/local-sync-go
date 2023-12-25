package utils

import (
	"github.com/google/uuid"
	"log"
	"strings"
	"time"
)

// timer returns a function that prints the name argument and
// the elapsed time between the call to timer and the call to
// the returned function. The returned function is intended to
// be used in a defer statement:
//
//	defer timer("sum")()
func Timer(name string) func() {
	start := time.Now()
	return func() {
		log.Printf("%s took %v\n", name, time.Since(start))
	}
}

func RandomUUID() string {
	return strings.ToUpper(uuid.New().String())
}
