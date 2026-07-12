-- Database for S.T. TRAN EXPRESS Logistics
-- สร้าง database ก่อน: CREATE DATABASE back_logistic;
-- แล้วรัน: \c back_logistic;

CREATE TABLE IF NOT EXISTS bank (
  bank_id VARCHAR(10) PRIMARY KEY,
  bank_name VARCHAR(100)
);

-- 2. account
CREATE TABLE IF NOT EXISTS account (
  account_no VARCHAR(50) PRIMARY KEY,
  account_name VARCHAR(255),
  bank_branch VARCHAR(100),
  bank_id VARCHAR(10) REFERENCES bank(bank_id)
);

-- 3. customers
CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR(10) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(20),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  contact_person VARCHAR(100)
);

-- 4. cars
CREATE TABLE IF NOT EXISTS cars (
  car_id VARCHAR(10) PRIMARY KEY,
  car_number VARCHAR(50) NOT NULL,
  car_type VARCHAR(50)
);

-- 5. driver
CREATE TABLE IF NOT EXISTS driver (
  driver_id VARCHAR(10) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50)
);

-- 6. employee
CREATE TABLE IF NOT EXISTS employee (
  employee_id VARCHAR(10) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100)
);

-- 7. status
CREATE TABLE IF NOT EXISTS status (
  status_id VARCHAR(10) PRIMARY KEY,
  status_name VARCHAR(100)
);

-- 8. service_type
CREATE TABLE IF NOT EXISTS service_type (
  service_typeID VARCHAR(10) PRIMARY KEY,
  service_typeNAME VARCHAR(100)
);

-- 9. service
CREATE TABLE IF NOT EXISTS service (
  service_id VARCHAR(10) PRIMARY KEY,
  service_typeID VARCHAR(10) REFERENCES service_type(service_typeID),
  description TEXT,
  default_price DECIMAL(12,2),
  unit VARCHAR(50)
);

-- 10. consigner
CREATE TABLE IF NOT EXISTS consigner (
  consigner_id VARCHAR(10) PRIMARY KEY,
  consigner_name VARCHAR(255),
  address TEXT
);

-- 11. consignee
CREATE TABLE IF NOT EXISTS consignee (
  consignee_id VARCHAR(10) PRIMARY KEY,
  consignee_name VARCHAR(255),
  address TEXT
);

-- 12. document
CREATE TABLE IF NOT EXISTS document (
  document_id VARCHAR(10) PRIMARY KEY,
  document_type VARCHAR(50),
  document_no VARCHAR(50),
  document_date DATE,
  account_no VARCHAR(50),
  customer_id VARCHAR(10) REFERENCES customers(customer_id),
  st_no VARCHAR(50),
  st_date DATE,
  re_no VARCHAR(50),
  re_date DATE,
  withholding_percent DECIMAL(5,2),
  withholding_amount DECIMAL(12,2),
  grand_total DECIMAL(12,2),
  net_total DECIMAL(12,2),
  status VARCHAR(50),
  remark TEXT,
  driver_id VARCHAR(10) REFERENCES driver(driver_id),
  car_id VARCHAR(10) REFERENCES cars(car_id),
  do_no VARCHAR(50),
  do_date DATE,
  consigner_id VARCHAR(10) REFERENCES consigner(consigner_id),
  consignee_id VARCHAR(10) REFERENCES consignee(consignee_id)
);

-- 13. document_items
CREATE TABLE IF NOT EXISTS document_items (
  document_items_id VARCHAR(10) PRIMARY KEY,
  document_id VARCHAR(10) REFERENCES document(document_id),
  service_id VARCHAR(10) REFERENCES service(service_id),
  description TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2)
);

-- 14. delivery_orders
CREATE TABLE IF NOT EXISTS delivery_orders (
  delivery_orders_id VARCHAR(10) PRIMARY KEY,
  document_id VARCHAR(10) REFERENCES document(document_id),
  service_id VARCHAR(10) REFERENCES service(service_id),
  description TEXT,
  quantity DECIMAL(10,2),
  unit VARCHAR(50)
);

-- 15. location
CREATE TABLE IF NOT EXISTS location (
  location_id VARCHAR(10) PRIMARY KEY,
  load_from VARCHAR(255),
  destination VARCHAR(255),
  country VARCHAR(100)
);
