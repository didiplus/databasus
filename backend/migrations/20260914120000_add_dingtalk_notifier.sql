-- +goose Up
-- +goose StatementBegin

CREATE TABLE dingtalk_notifiers (
     notifier_id UUID PRIMARY KEY,
     webhook_url TEXT NOT NULL,
     secret      TEXT
);

ALTER TABLE dingtalk_notifiers
    ADD CONSTRAINT fk_dingtalk_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS dingtalk_notifiers;
-- +goose StatementEnd