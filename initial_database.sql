CREATE TYPE user_role AS ENUM ('admin', 'approver', 'employee');
CREATE TYPE pr_status AS ENUM ('Request', 'Approve', 'Released', 'Received');


CREATE TYPE user_status AS ENUM ('active', 'dismissed', 'suspended');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    
    -- Added the new status column here
    status user_status NOT NULL DEFAULT 'active', 
    
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    pr_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    purpose_of_requests TEXT NOT NULL,
    total_estimated_cost NUMERIC(12, 2) DEFAULT 0.00,
    status pr_status NOT NULL DEFAULT 'Request', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pr_line_items (
    id SERIAL PRIMARY KEY,
    pr_id INT REFERENCES purchase_requests(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    vendor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_form (
    id SERIAL PRIMARY KEY,
    pr_id INT REFERENCES purchase_requests(id) ON DELETE CASCADE,
    approver_id INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    action_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);