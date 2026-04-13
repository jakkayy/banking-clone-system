CREATE TYPE account_type AS ENUM ('savings', 'checking');

CREATE TABLE accounts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(10) UNIQUE NOT NULL,
    type           account_type NOT NULL DEFAULT 'savings',
    balance        DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency       VARCHAR(3) NOT NULL DEFAULT 'THB',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
