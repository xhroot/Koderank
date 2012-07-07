package twilio

import (
	"fmt"
	"net/url"
)

type ScopeUri struct {
	service   string
	privilege string
	options   url.Values
}

func (su *ScopeUri) String() string {
	str := fmt.Sprintf("scope:%v:%v?%v", su.service, su.privilege,
		su.options.Encode())
	return str
}

func (su *ScopeUri) SetOption(key string, value string) {
	su.options.Set(key, value)
}
