--1.bank
CREATE TABLE bank (
  bank_id VARCHAR(10) PRIMARY KEY,
  bank_name VARCHAR(100)
);
--2.customers
CREATE TABLE customers (
  customer_id VARCHAR(10) PRIMARY KEY,
  customer_name VARCHAR(255),
  tax_id VARCHAR(20),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  contact_person VARCHAR(100)
);

CREATE TABLE cars (
  car_id VARCHAR(10) PRIMARY KEY,
  car_number VARCHAR(50),
  car_type VARCHAR(50),
  capacity NUMERIC,
  capacity_unit VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Available',
  assigned_driver_id VARCHAR(10),
  notes TEXT
);


-- 5. status
CREATE TABLE status (
  status_id VARCHAR(10) PRIMARY KEY,
  status_name VARCHAR(100)
);

-- 6. driver
CREATE TABLE driver (
  driver_id VARCHAR(10) PRIMARY KEY,
  full_name VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  license_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Available',
  assigned_car_id VARCHAR(10),
  notes TEXT
);

-- 7. service_type 
CREATE TABLE service_type (
  service_typeID VARCHAR(10) PRIMARY KEY,
  service_typeNAME VARCHAR(100)
);

-- 8. location
CREATE TABLE location (
  location_id VARCHAR(10) PRIMARY KEY,
  load_from VARCHAR(255),
  destination VARCHAR(255),
  country VARCHAR(100)
);

-- 9. consigner
CREATE TABLE consigner (
  consigner_id VARCHAR(10) PRIMARY KEY,
  consigner_name VARCHAR(255),
  address TEXT
);

-- 10. consignee 
create table consignee(
  consignee_id VARCHAR(10) PRIMARY KEY,
  consignee_name VARCHAR(255),
  address TEXT
);



-- 11. account
CREATE TABLE account (
  account_no VARCHAR(50) PRIMARY KEY,
  account_name VARCHAR(255),
  bank_branch VARCHAR(100),
  bank_id VARCHAR(10),
  FOREIGN KEY (bank_id) REFERENCES bank(bank_id)
);

-- 12. service

-- 2. สร้างตารางใหม่ที่มีคอลัมน์ครบถ้วน
CREATE TABLE service (
    service_id VARCHAR(10) PRIMARY KEY,
    service_typeID VARCHAR(10),
    description TEXT,
    quantity INT,
    unit_quantity VARCHAR(50),
    default_price DECIMAL(12,2),
    unit VARCHAR(50),
    FOREIGN KEY (service_typeID) REFERENCES service_type(service_typeID)
);

-- 13. document
CREATE TABLE document (
  document_id VARCHAR(10) PRIMARY KEY,
  document_type VARCHAR(50),
  document_no VARCHAR(50),
  document_date DATE,
  account_no VARCHAR(50),
  customer_id VARCHAR(10),
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
  driver_id VARCHAR(10),
  car_id VARCHAR(10),
  do_no VARCHAR(50),
  do_date DATE,
  consigner_id VARCHAR(10),
  consignee_id VARCHAR(10),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id), 
  FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
  FOREIGN KEY (car_id) REFERENCES cars(car_id),                
  FOREIGN KEY (consigner_id) REFERENCES consigner(consigner_id),
  FOREIGN KEY (consignee_id) REFERENCES consignee(consignee_id)
);

-- 14. document_items
DROP TABLE document_items CASCADE;
CREATE TABLE document_items (
  document_items_id VARCHAR(10) PRIMARY KEY,
  document_id VARCHAR(10),
  service_id VARCHAR(10),
  FOREIGN KEY (document_id) REFERENCES document(document_id),
  FOREIGN KEY (service_id) REFERENCES service(service_id)
);

-- 15. delivery_orders
CREATE TABLE delivery_orders (
  delivery_orders_id VARCHAR(10) PRIMARY KEY,
  document_id VARCHAR(10),
  service_id VARCHAR(10),
  description TEXT,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  FOREIGN KEY (document_id) REFERENCES document(document_id),
  FOREIGN KEY (service_id) REFERENCES service(service_id)
);