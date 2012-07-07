
package koderank

import (
  "net/http"
  "appengine"
  "html/template"
  "time"
  "encoding/xml"
  "fmt"
)

func init() {
  http.HandleFunc("/sitemap.xml", sitemapHandler)
}

func sitemapHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)

  baseUrl := "http://koderank.appspot.com/"
  today := time.Now().Format("2006-01-02")

  locations := []map[string]interface{} {
    {"Loc": baseUrl, "Lastmod": today, "Changefreq": "weekly"},
    {"Loc": baseUrl + "about", "Lastmod": today, "Changefreq": "weekly"},
  }

  t, err := template.ParseFiles("view/sitemap.xml")
  if err != nil {
    c.Errorf("template.ParseFiles: %s", err)
    http.Error(w, "There was a problem rendering the sitemap.",
        http.StatusInternalServerError)
    return
  }

  w.Header().Set("Content-Type", "text/xml")
  // Write header manually. t.Execute escapes the "<" instead of rendering.
  fmt.Fprint(w, xml.Header)

  err = t.Execute(w, locations)
  if err != nil {
    c.Errorf("s.Execute: %s", err)
    http.Error(w, "There was a problem rendering the page.",
        http.StatusInternalServerError)
  }
}

