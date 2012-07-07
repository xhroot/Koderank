
package koderank

import "appengine"

type MasterVM struct {
  IsDevAppServer bool
  Pages []PageInfo
}

func NewMasterVM(pages []PageInfo) *MasterVM {
  return &MasterVM{ appengine.IsDevAppServer(), pages }
}

type WhiteboardVM struct {
  MasterVM // Anonymous field; "inheritance" through promotion

  Message string
  IsInterviewer bool
  Interviewer string
  Candidate string
  TwilioToken string
  ChannelToken string
}

func NewWhiteboardVM() *WhiteboardVM {
  vm := new(WhiteboardVM)
  vm.IsDevAppServer = appengine.IsDevAppServer()
  return vm
}

type PageInfo struct {
  Name string
  RelativeUrl string
  IsActive bool
}

type JsonVM struct {
  IsSuccess bool
  Messages []string
  Payload interface{}
}

