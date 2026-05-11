package notifier

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Event — сообщение, рассылаемое клиентам.
type Event struct {
	Type    string      `json:"type"`    // "submission_submitted" | "grade_updated" | "job_status" | ...
	Payload interface{} `json:"payload"`
	At      time.Time   `json:"at"`
}

// Hub — простая шина для WebSocket-клиентов, сгруппированных по userID.
type Hub struct {
	mu      sync.RWMutex
	clients map[uint]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: map[uint]map[*Client]struct{}{}}
}

func (h *Hub) Add(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	set, ok := h.clients[c.UserID]
	if !ok {
		set = map[*Client]struct{}{}
		h.clients[c.UserID] = set
	}
	set[c] = struct{}{}
}

func (h *Hub) Remove(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.clients[c.UserID]; ok {
		delete(set, c)
		if len(set) == 0 {
			delete(h.clients, c.UserID)
		}
	}
}

// SendToUser шлёт событие всем активным сокетам пользователя.
func (h *Hub) SendToUser(userID uint, eventType string, payload interface{}) {
	h.mu.RLock()
	set, ok := h.clients[userID]
	if !ok {
		h.mu.RUnlock()
		return
	}
	clients := make([]*Client, 0, len(set))
	for c := range set {
		clients = append(clients, c)
	}
	h.mu.RUnlock()

	ev := Event{Type: eventType, Payload: payload, At: time.Now()}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	for _, c := range clients {
		c.send(data)
	}
}

// Broadcast — рассылка всем подключённым (использовать осторожно).
func (h *Hub) Broadcast(eventType string, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	ev := Event{Type: eventType, Payload: payload, At: time.Now()}
	data, _ := json.Marshal(ev)
	for _, set := range h.clients {
		for c := range set {
			c.send(data)
		}
	}
}

// ─── Client ───────────────────────────────────────────────────────────────────

type Client struct {
	UserID uint
	conn   *websocket.Conn
	out    chan []byte
	closed bool
	mu     sync.Mutex
}

func NewClient(userID uint, conn *websocket.Conn) *Client {
	return &Client{
		UserID: userID,
		conn:   conn,
		out:    make(chan []byte, 16),
	}
}

func (c *Client) send(data []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		return
	}
	select {
	case c.out <- data:
	default:
		// канал переполнен → отключаем клиента
		c.closed = true
		_ = c.conn.Close()
	}
}

// Run — двусторонний цикл (write/ping). Запускать в горутине после подключения.
func (c *Client) Run(hub *Hub) {
	defer func() {
		hub.Remove(c)
		c.mu.Lock()
		c.closed = true
		c.mu.Unlock()
		_ = c.conn.Close()
	}()

	// reader: только дренаж (для срабатывания ошибок и ping/pong)
	go func() {
		c.conn.SetReadLimit(1024)
		_ = c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		c.conn.SetPongHandler(func(string) error {
			_ = c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			return nil
		})
		for {
			if _, _, err := c.conn.ReadMessage(); err != nil {
				return
			}
		}
	}()

	// writer
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case msg, ok := <-c.out:
			if !ok {
				return
			}
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Println("[ws] ping failed:", err)
				return
			}
		}
	}
}
