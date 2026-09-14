-- +goose Up
-- +goose StatementBegin

CREATE TABLE feishu_notifiers (
     notifier_id UUID PRIMARY KEY,
     webhook_url TEXT NOT NULL,
     secret      TEXT
);

ALTER TABLE feishu_notifiers
    ADD CONSTRAINT fk_feishu_notifiers_notifier
    FOREIGN KEY (notifier_id)
    REFERENCES notifiers (id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS feishu_notifiers;
-- +goose StatementEnd