package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"

	webrtc "github.com/pion/webrtc/v3"
)

type CommandRequest struct {
	Id  string `json:"id"`
	Url string `json:"url"`
}

type CommandResponse struct {
	Id   string `json:"id"`
	Size int64  `json:"size"`
}

var (
	commandLabel    = "command"
	dataLabelPrefix = "data|"
	chunkSize       = 16 * 1024 // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels#understanding_message_size_limits
)

func newConnection(offer *webrtc.SessionDescription) (answer *webrtc.SessionDescription, err error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	fmt.Println("NewPeerConnection")

	// Create a new RTCPeerConnection
	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return
	}

	// Set the handler for Peer connection state
	// This will notify you when the peer has connected/disconnected
	peerConnection.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		fmt.Printf("Peer Connection State has changed: %s\n", s.String())

		if s == webrtc.PeerConnectionStateFailed {
			// Wait until PeerConnection has had no network activity for 30 seconds or another failure. It may be reconnected using an ICE Restart.
			// Use webrtc.PeerConnectionStateDisconnected if you are interested in detecting faster timeout.
			// Note that the PeerConnection may come back from PeerConnectionStateDisconnected.
			fmt.Println("Peer Connection has gone to failed, closing")
			peerConnection.Close()
		}
	})

	// Register data channel creation handling
	peerConnection.OnDataChannel(func(channel *webrtc.DataChannel) {
		fmt.Printf("New DataChannel %s %d\n", channel.Label(), channel.ID())

		if channel.Label() != commandLabel {
			return
		}

		commandChannel := channel

		commandChannel.OnMessage(func(msg webrtc.DataChannelMessage) {
			fmt.Printf("Message from commandChannel: %s\n", string(msg.Data))
			commandReq := &CommandRequest{}
			err := json.Unmarshal(msg.Data, commandReq)
			if err != nil {
				fmt.Printf("Parse command request failed: %s\n", string(msg.Data))
				return
			}

			resp, err := http.Get(commandReq.Url)
			if err != nil {
				fmt.Printf("http Get failed: %v\n", err)
				return
			}

			commandResp := &CommandResponse{
				Id:   commandReq.Id,
				Size: resp.ContentLength,
			}

			commandRespData, err := json.Marshal(commandResp)
			if err != nil {
				fmt.Printf("Marshal command response failed: %v\n", err)
				return
			}

			err = commandChannel.SendText(string(commandRespData))
			if err != nil {
				fmt.Printf("Send command response failed: %v\n", err)
				return
			}

			dataLabel := dataLabelPrefix + commandReq.Id

			dataChannel, err := peerConnection.CreateDataChannel(dataLabel, nil)
			if err != nil {
				fmt.Printf("CreateDataChannel failed: %v\n", err)
				return
			}

			dataChannel.OnOpen(func() {
				buffer := make([]byte, chunkSize)

				for {
					bytesread, err := resp.Body.Read(buffer)

					fmt.Println("resp body read", bytesread, err)
					dataChannel.Send(buffer[:bytesread])

					if err != nil {
						if err != io.EOF {
							fmt.Printf("Read resp body failed: %v\n", err)
						}

						break
					}
				}

				// dataChannel.Close()
			})
		})
	})

	fmt.Println("SetRemoteDescription")
	// Set the remote SessionDescription
	err = peerConnection.SetRemoteDescription(*offer)
	if err != nil {
		return
	}

	fmt.Println("CreateAnswer")
	// Create an answer
	tempAnswer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		return
	}

	// ==== debug ice event ====
	peerConnection.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		fmt.Println("OnICECandidate:", candidate)
	})
	peerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		fmt.Println("OnICEConnectionStateChange:", state)
	})
	peerConnection.OnICEGatheringStateChange(func(state webrtc.ICEGathererState) {
		fmt.Println("OnICEGatheringStateChange:", state)
	})
	// ==== debug ice event ====

	fmt.Println("GatheringCompletePromise")
	// Create channel that is blocked until ICE Gathering is complete
	gatherComplete := webrtc.GatheringCompletePromise(peerConnection)

	fmt.Println("SetLocalDescription")
	// Sets the LocalDescription, and starts our UDP listeners
	err = peerConnection.SetLocalDescription(tempAnswer)
	if err != nil {
		panic(err)
	}

	fmt.Println("wait for gatherComplete")
	// Block until ICE Gathering is complete, disabling trickle ICE
	// we do this because we only can exchange one signaling message
	// in a production application you should exchange ICE Candidates via OnICECandidate
	<-gatherComplete

	fmt.Println("done")
	answer = peerConnection.LocalDescription()
	return
}

func connect(w http.ResponseWriter, req *http.Request) {
	w.Header().Add("Access-Control-Allow-Origin", "*")

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		fmt.Printf("Read body failed: %v\n", err)
		w.WriteHeader(500)
		return
	}

	offer := &webrtc.SessionDescription{}
	err = json.Unmarshal(body, offer)
	if err != nil {
		fmt.Printf("Parse body failed: %v\n", err)
		w.WriteHeader(500)
		return
	}

	answer, err := newConnection(offer)
	if err != nil {
		fmt.Printf("New connection failed: %v\n", err)
		w.WriteHeader(500)
		return
	}

	respBody, err := json.Marshal(answer)
	if err != nil {
		fmt.Printf("Marshal body failed: %v\n", err)
		w.WriteHeader(500)
		return
	}
	w.WriteHeader(200)
	w.Write(respBody)
}

func runSignalServer() {
	http.HandleFunc("/connect", connect)
	http.ListenAndServe(":8000", nil)
}

func main() {
	runSignalServer()
}
