
package koderank

import (
  "fmt"
  "net/http"
  "appengine"
  "appengine/mail"
  "appengine/channel"
  "encoding/json"
  "html/template"
  "repository"
  "twilio"
  "encoding/xml"
  "time"
)

func init() {
  http.HandleFunc("/", homeHandler)
  http.HandleFunc("/create", createUserHandler)
  http.HandleFunc("/email", emailHandler)

  http.HandleFunc("/whiteboard", whiteboardHandler)
  http.HandleFunc("/message", messageHandler)
  http.HandleFunc("/call", callHandler)

  http.HandleFunc("/about", aboutHandler)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)
  pages := []PageInfo {
    {"Home", "/", true},
    {"About", "/about", false},
  }
  vm := NewMasterVM(pages)

  renderPage(w, c, "view/home.html", vm)
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)

  if r.Method != "POST" {
    c.Errorf("createUserHandler did not expect %s", r.Method )
    http.Error(w, "Method not allowed.", http.StatusInternalServerError)
    return
  }

  repo := repository.NewRepo(c)
  candidate, interviewer, err := repo.CreateSession()
  if err != nil {
    c.Errorf("repository.CreateSession: %s", err)
    http.Error(w, "Problem with datastore.", http.StatusInternalServerError)
    return
  }

  vm := map[string] string {
    "c" : candidate,
    "i" : interviewer,
  }

  renderJson(w, c, vm)
}

func whiteboardHandler(w http.ResponseWriter, r *http.Request) {
  vm := NewWhiteboardVM()
  c := appengine.NewContext(r)

  code := r.FormValue("x")
  repo := repository.NewRepo(c)
  candidate, interviewer, err := repo.GetSession(code)

  if err != nil {
    c.Errorf("repo.GetSession: %v", err)
    http.Redirect(w, r, "/", http.StatusMovedPermanently)
    return
  }

  vm.Candidate, vm.Interviewer = candidate, interviewer

  tc := twilio.NewTwilioCapability(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

  vm.IsInterviewer = (code == interviewer)
  if vm.IsInterviewer {
    vm.Message = "Interviewer mode."
    tc.AllowClientOutgoing(TWILIO_APP_SID, nil)
  } else {
    vm.Message = "Candidate mode."
    tc.AllowClientIncoming(candidate)
  }

  tokenExpiration := time.Duration(48) * time.Hour

  twilioToken, err := tc.Generate(tokenExpiration)

  if err != nil {
    c.Errorf("capability.Generate: %s", err)
    http.Error(w, "Twilio setup error.", http.StatusInternalServerError)
    return
  }
  vm.TwilioToken = twilioToken

  // Create channel token.
  tok, err := channel.Create(c, code)
  if err != nil {
    c.Errorf("template.ParseSetFiles: %s", err)
    http.Error(w, "Channel error.", http.StatusInternalServerError)
    return
  }
  vm.ChannelToken = tok

  renderPage(w, c, "view/whiteboard.html", vm)
}

func messageHandler(w http.ResponseWriter, r *http.Request) {

  w.Header().Set("Content-Type", "application/json")

  c := appengine.NewContext(r)
  if r.Method != "POST" {
    c.Errorf("messageHandler did not expect %s", r.Method)
    http.Error(w, "Method not allowed.", http.StatusInternalServerError)
    return
  }

  var patchSet map[string]interface{}

  defer r.Body.Close()
  if err := json.NewDecoder(r.Body).Decode(&patchSet); err != nil {
    c.Errorf("json.NewDecoder: %s", err)
    http.Error(w, "Error decoding json.", http.StatusInternalServerError)
    return
  }

  code := patchSet["key"].(string)
  repo := repository.NewRepo(c)

  candidate, interviewer, err := repo.GetSession(code)
  if err != nil {
    c.Errorf("repo.GetSession: %v", err)
    http.Redirect(w, r, "/", 301)
    return
  }

  if code == interviewer {
    err := channel.SendJSON(c, candidate, patchSet)
    if err != nil {
      c.Errorf("channel.SendJSON, problem sending: %s.", err)
      http.Error(w, "Error decoding json.", http.StatusInternalServerError)
    }
  } else {
    err := channel.SendJSON(c, interviewer, patchSet)
    if err != nil {
      c.Errorf("channel.SendJSON, problem sending: %s.", err)
      http.Error(w, "Error decoding json.", http.StatusInternalServerError)
    }
  }
}

func callHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)
  callTo := r.FormValue("To")

  // Write XML header.
  fmt.Fprint(w, xml.Header)
  // Create structure for client call.
  twiml := twilio.Response{ Dial: twilio.Dial{ callTo } }
  // Serialize to TwiML and write.
  xdoc, err := xml.Marshal(twiml)
  if err != nil {
    c.Errorf("xml.Marshal: %s", err)
    http.Error(w, "There was a problem creating the TwiML.",
        http.StatusInternalServerError)
  }
  fmt.Fprint(w, string(xdoc))
}

// About page
func aboutHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)
  pages := []PageInfo {
    {"Home", "/", false},
    {"About", "/about", true},
  }
  vm := NewMasterVM(pages)
  renderPage(w, c, "view/about.html", vm)
}

func emailHandler(w http.ResponseWriter, r *http.Request) {
  c := appengine.NewContext(r)
  if r.Method != "POST" {
    c.Errorf("messageHandler did not expect %s", r.Method)
    http.Error(w, "Method not allowed.", http.StatusInternalServerError)
    return
  }

  vm := JsonVM { false, nil, nil }

  candidateNote := `
Hi,

Congratulations on securing a code interview!  The link below is 
your invitation to a Koderank session, where you will have the 
opportunity to demonstrate your problem solving abilities live. 

http://koderank.appspot.com/whiteboard?x=%s

In-browser voice chat will be availble during the interview 
(Adobe Flash required).  Visit the link below to adjust and test 
your microphone/speakers before connecting.

http://clientsupport.twilio.com

Good luck!

The Koderank team
`
  code := r.FormValue("code")
  email := r.FormValue("email")

  msg := &mail.Message{
    Sender: "Koderank <donotreply@koderank.appspotmail.com>",
    To: []string{email},
    Subject: "Koderank online code interview",
    Body: fmt.Sprintf(candidateNote, code),
  }

  if err := mail.Send(c, msg); err != nil {
    c.Errorf("mail.Send: %s", err)
    vm.Messages = []string{"There was a problem sending the email."}
    renderJson(w, c, vm)
    return
  }

  vm.IsSuccess = true
  vm.Messages = []string{"Email sent."}
  renderJson(w, c, vm)
}

func renderJson(w http.ResponseWriter, c appengine.Context, vm interface{}) {
  w.Header().Set("Content-Type", "application/json")
  j, err := json.Marshal(vm)
  if err != nil {
    c.Errorf("json.Marshal: %s", err)
    http.Error(w, "Problem serializing data.", http.StatusInternalServerError)
    return
  }
  fmt.Fprint(w, string(j))
}

// Fuse master with `page`; apply `view` template; render to `w` Response
func renderPage(w http.ResponseWriter, c appengine.Context, page string,
    vm interface{}) {

  s, err := template.New("master").ParseFiles("view/master.html", page)
  if err != nil {
    c.Errorf("template.ParseFiles: %s", err)
    http.Error(w, "There was a problem rendering the page.",
        http.StatusInternalServerError)
    return
  }

  err = s.Execute(w, vm)
  if err != nil {
    c.Errorf("s.Execute: %s", err)
    http.Error(w, "There was a problem rendering the page.",
        http.StatusInternalServerError)
  }
}

