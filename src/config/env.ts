import path from 'path';

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'super_secure_dante_logistics_jwt_secret_key_2026_xyz',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../data/dante.db'),
  DEFAULT_EXCHANGE_RATE: parseFloat(process.env.DEFAULT_EXCHANGE_RATE || '1500'), // 1 USD = 1500 IQD default
  DEFAULT_WAREHOUSE_NAME: process.env.DEFAULT_WAREHOUSE_NAME || 'Dante Global Cargo Hub',
  DEFAULT_WAREHOUSE_ADDRESS_EN:
    process.env.DEFAULT_WAREHOUSE_ADDRESS_EN ||
    'Building 4, Logistics Park, Baiyun District, Guangzhou, Guangdong, China',
  DEFAULT_WAREHOUSE_ADDRESS_ZH:
    process.env.DEFAULT_WAREHOUSE_ADDRESS_ZH ||
    '中国广东省广州市白云区物流园4栋',
  DEFAULT_WAREHOUSE_PHONE: process.env.DEFAULT_WAREHOUSE_PHONE || '+86 138 0013 8000',
  DEFAULT_AIR_RATE_PER_KG_USD: parseFloat(process.env.DEFAULT_AIR_RATE_PER_KG_USD || '7.5'),
  DEFAULT_SEA_RATE_PER_CBM_USD: parseFloat(process.env.DEFAULT_SEA_RATE_PER_CBM_USD || '220.0'),
};
