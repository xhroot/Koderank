package repository

import (
	"appengine"
	"appengine/memcache"
	"strings"
  "time"
)

const (
	DELIMITER = "|"
)

type KodeSession struct {
	Candidate    string
	Interviewer  string
	Pair         []string
	Date_created time.Time
}

func (ks *KodeSession) ToCache(c appengine.Context) error {
	pair := strings.Join(ks.Pair, DELIMITER)

	// Cache the session under both ids.
	items := []*memcache.Item{
		&memcache.Item{Key: ks.Candidate, Value: []byte(pair)},
		&memcache.Item{Key: ks.Interviewer, Value: []byte(pair)},
	}

	err := memcache.SetMulti(c, items)
  if err != nil {
    return err
  }

	return nil
}

func FromCache(c appengine.Context, code string) (candidate string, interviewer string, err error) {

	item, err := memcache.Get(c, code)
	if err != nil {
		return "", "", err
	}

	pair := strings.Split(string(item.Value), DELIMITER)

	return pair[0], pair[1], nil
}
