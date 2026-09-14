package feishu_notifier

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/google/uuid"

	notifier_models "databasus-backend/internal/features/notifiers/models"
	"databasus-backend/internal/util/encryption"
)

type FeishuNotifier struct {
	NotifierID uuid.UUID `gorm:"type:uuid;primaryKey;column:notifier_id" json:"notifierId"`
	WebhookURL string    `gorm:"type:text;not null;column:webhook_url"      json:"webhookUrl"`
	Secret     string    `gorm:"type:text;column:secret"                    json:"secret"`
}

func (FeishuNotifier) TableName() string {
	return "feishu_notifiers"
}

func (n *FeishuNotifier) Validate(encryptor encryption.FieldEncryptor) error {
	if n.WebhookURL == "" {
		return errors.New("webhook_url is required")
	}

	webhookURL, err := encryptor.Decrypt(n.WebhookURL)
	if err != nil {
		return fmt.Errorf("failed to decrypt webhook URL: %w", err)
	}

	u, err := url.Parse(webhookURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return errors.New("invalid webhook_url")
	}

	return nil
}

type textPayload struct {
	MsgType   string `json:"msg_type"`
	Content   struct {
		Text string `json:"text"`
	} `json:"content"`
	Timestamp string `json:"timestamp,omitzero"`
	Sign      string `json:"sign,omitzero"`
}

func (n *FeishuNotifier) Send(
	encryptor encryption.FieldEncryptor,
	logger *slog.Logger,
	notification notifier_models.Notification,
) error {
	if err := n.Validate(encryptor); err != nil {
		return err
	}

	webhookURL, err := encryptor.Decrypt(n.WebhookURL)
	if err != nil {
		return fmt.Errorf("failed to decrypt webhook URL: %w", err)
	}

	secret := ""
	if n.Secret != "" {
		secret, err = encryptor.Decrypt(n.Secret)
		if err != nil {
			return fmt.Errorf("failed to decrypt secret: %w", err)
		}
	}

	payload := textPayload{MsgType: "text"}
	payload.Content.Text = notification.Heading + "\n" + notification.Message

	if secret != "" {
		timestamp := time.Now().Unix()
		stringToSign := fmt.Sprintf("%d\n%s", timestamp, secret)
		h := hmac.New(sha256.New, []byte(secret))
		h.Write([]byte(stringToSign))
		sign := base64.StdEncoding.EncodeToString(h.Sum(nil))

		payload.Timestamp = strconv.FormatInt(timestamp, 10)
		payload.Sign = sign
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return notifier_models.ErrorWithoutWebhookURLCredentials(err)
	}

	defer func() {
		if closeErr := resp.Body.Close(); closeErr != nil {
			logger.Error("failed to close response body", "error", closeErr)
		}
	}()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("feishu webhook returned status %d", resp.StatusCode)
	}

	return nil
}

func (n *FeishuNotifier) HideSensitiveData() {
	n.WebhookURL = ""
	n.Secret = ""
}

func (n *FeishuNotifier) Update(incoming *FeishuNotifier) {
	if incoming.WebhookURL != "" {
		n.WebhookURL = incoming.WebhookURL
	}
	n.Secret = incoming.Secret
}

func (n *FeishuNotifier) EncryptSensitiveData(encryptor encryption.FieldEncryptor) error {
	if n.WebhookURL != "" {
		encrypted, err := encryptor.Encrypt(n.WebhookURL)
		if err != nil {
			return fmt.Errorf("failed to encrypt webhook URL: %w", err)
		}
		n.WebhookURL = encrypted
	}

	if n.Secret != "" {
		encrypted, err := encryptor.Encrypt(n.Secret)
		if err != nil {
			return fmt.Errorf("failed to encrypt secret: %w", err)
		}
		n.Secret = encrypted
	}

	return nil
}