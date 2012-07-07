
package twilio

import (
  "encoding/xml"
)

type Response struct {
  XMLName xml.Name `xml:"Response"`
  Dial Dial
}

type Dial struct {
  Client string
}

