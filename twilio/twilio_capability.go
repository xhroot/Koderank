package twilio

import (
  "fmt"
  "jwt"
  "net/url"
  "time"
)

type TwilioCapability struct {
  accountSid string
  authToken  string
  clientName string
  scope []ScopeUri
}

func NewTwilioCapability(sid string, tok string) *TwilioCapability {
  tc := TwilioCapability{sid, tok, "", make([]ScopeUri, 0)}
  return &tc
}

func (tc *TwilioCapability) AllowClientOutgoing(applicationSid string,
  appParams url.Values) {

  //TODO: serialization for nested appParams in ScopeUri.String() 
  if appParams != nil {
    panic("TwilioCapability.AllowClientOutgoing appParams not implemented.")
  }

  options := url.Values{
    "appSid": []string{applicationSid},
  }
  tc.scope = append(tc.scope, ScopeUri{"client", "outgoing", options})
}

func (tc *TwilioCapability) AllowClientIncoming(clientName string) {
  tc.clientName = clientName
  tc.scope = append(tc.scope, ScopeUri{"client", "incoming", url.Values{}})
}

func (tc *TwilioCapability) SerializeScope() (scopeString string) {
  for i, su := range tc.scope {
    if tc.clientName != "" {
      su.SetOption("clientName", tc.clientName)
    }

    scopeString += su.String()
    if i+1 < len(tc.scope) {
      scopeString += " "
    }
  }
  return scopeString
}

func (tc *TwilioCapability) Generate(ttl time.Duration) (twilioToken string,
  err error) {

  payload := map[string]interface{}{
    "iss":   tc.accountSid,
    "exp":   time.Now().Add(ttl).Unix(),
    "scope": tc.SerializeScope(),
  }

  token, err := jwt.Encode(payload, []byte(tc.authToken), "HS256")
  if err != nil {
    return "", fmt.Errorf("Problem encoding TwilioCapability.")
  }

  return string(token), nil
}
