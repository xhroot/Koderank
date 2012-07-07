package repository

import (
	"appengine"
	"appengine/datastore"
	"appengine/memcache"
	"fmt"
	"time"
	"uuid"
)

type Repo struct {
	c appengine.Context
}

func NewRepo(c appengine.Context) *Repo {
	return &Repo{
		c: c,
	}
}

func (sr *Repo) CreateSession() (candidate string, interviewer string,
	err error) {

	candidate = uuid.NewUuid62()
	interviewer = uuid.NewUuid62()

	ks := KodeSession{
		Candidate:    candidate,
		Interviewer:  interviewer,
		Pair:         []string{candidate, interviewer},
		Date_created: time.Now(),
	}

	k := datastore.NewIncompleteKey(sr.c, "KodeSession", nil)
	_, err = datastore.Put(sr.c, k, &ks)
	if err != nil {
		return "", "", err
	}

	// Store in memcache.
	if err = ks.ToCache(sr.c); err != nil {
		return "", "", err
	}

	return candidate, interviewer, nil
}

func (sr *Repo) GetSession(code string) (candidate string, interviewer string,
	err error) {

  // Check memcache 1st.
	candidate, interviewer, err = FromCache(sr.c, code)
	if err != nil && err != memcache.ErrCacheMiss {
		// There was an error and it wasn't a cache miss; unexpected.
		return "", "", err
	}

	if err == nil {
    // No surprise, should be in memcache 99% of the time.
		return candidate, interviewer, nil
	}

  // Cache miss.

	var ks KodeSession

	q := datastore.NewQuery("KodeSession").Filter("Pair =", code)
	t := q.Run(sr.c)
	_, err = t.Next(&ks)

	// Error: missing record.
	if err == datastore.Done {
		sr.c.Errorf("t.Next: %v", err)
		return "", "", fmt.Errorf("Session not found, %s", code)
	}
	// All other errors.
	if err != nil {
		sr.c.Errorf("t.Next: %v", err)
		return "", "", err
	}

  // Put it in memcache.
	if err = ks.ToCache(sr.c); err != nil {
		return "", "", err
	}

	return ks.Candidate, ks.Interviewer, nil
}
