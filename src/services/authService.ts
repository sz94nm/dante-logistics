import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { User, UserPublicProfile } from '../models/types';
import { formatCustomerCode } from '../utils/codeGenerator';
import { UserRole, IraqiCity } from '../config/constants';
import { AuthUserPayload } from '../middleware/auth';

export interface RegisterUserInput {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  city: IraqiCity;
  local_address: string;
  nearest_point: string;
  role?: UserRole;
  preferred_language?: 'ar' | 'en';
}

export class AuthService {
  constructor(private db: Database.Database) {}

  /**
   * Generates next unique customer code atomically.
   */
  private getNextCustomerCode(): string {
    const update = this.db.prepare(
      `UPDATE sequence_counters SET current_value = current_value + 1 WHERE name = 'customer_code' RETURNING current_value`
    );
    const row = update.get() as { current_value: number };
    return formatCustomerCode(row.current_value);
  }

  /**
   * Registers a new user.
   */
  public async register(input: RegisterUserInput): Promise<{ user: UserPublicProfile; token: string }> {
    const existing = this.db
      .prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
      .get(input.email.toLowerCase(), input.phone);

    if (existing) {
      throw { status: 409, message: 'A user with this email or phone number already exists' };
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(input.password, salt);

    const id = crypto.randomUUID();
    const role = input.role || 'customer';
    // Only customers get a personal mailbox code; staff/managers get an identifier too
    const personal_code = this.getNextCustomerCode();
    const now = new Date().toISOString();

    const insert = this.db.prepare(`
      INSERT INTO users (
        id, personal_code, full_name, phone, email, password_hash,
        city, local_address, nearest_point, role, preferred_language,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      personal_code,
      input.full_name,
      input.phone,
      input.email.toLowerCase(),
      password_hash,
      input.city,
      input.local_address,
      input.nearest_point,
      role,
      input.preferred_language || 'ar',
      now,
      now
    );

    const user: UserPublicProfile = {
      id,
      personal_code,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email.toLowerCase(),
      city: input.city,
      local_address: input.local_address,
      nearest_point: input.nearest_point,
      role,
      preferred_language: input.preferred_language || 'ar',
      created_at: now,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Authenticates user by email, phone, or personal code.
   */
  public async login(identifier: string, password: string): Promise<{ user: UserPublicProfile; token: string }> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanCode = identifier.trim().toUpperCase();

    const stmt = this.db.prepare(`
      SELECT * FROM users
      WHERE LOWER(email) = ? OR phone = ? OR personal_code = ?
    `);

    const userRecord = stmt.get(cleanId, identifier.trim(), cleanCode) as User | undefined;

    if (!userRecord) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const user: UserPublicProfile = {
      id: userRecord.id,
      personal_code: userRecord.personal_code,
      full_name: userRecord.full_name,
      phone: userRecord.phone,
      email: userRecord.email,
      city: userRecord.city,
      local_address: userRecord.local_address,
      nearest_point: userRecord.nearest_point,
      role: userRecord.role,
      preferred_language: userRecord.preferred_language,
      created_at: userRecord.created_at,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Generates a signed JWT.
   */
  public generateToken(user: UserPublicProfile): string {
    const payload: AuthUserPayload = {
      userId: user.id,
      personal_code: user.personal_code,
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * Seeds initial admin/manager and warehouse staff accounts if empty.
   */
  public async seedDefaultAccounts(): Promise<void> {
    const managerCount = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'manager'").get() as {
      count: number;
    };

    if (managerCount.count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin@2026!', salt);
      const now = new Date().toISOString();

      this.db
        .prepare(`
        INSERT INTO users (
          id, personal_code, full_name, phone, email, password_hash,
          city, local_address, nearest_point, role, preferred_language,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .run(
          crypto.randomUUID(),
          'MGR-0001',
          'System Manager',
          '07700000001',
          'manager@dante.com',
          hash,
          'Baghdad',
          'HQ Office, Karrada',
          'Kahramana Square',
          'manager',
          'en',
          now,
          now
        );
    }

    const staffCount = this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'staff'").get() as {
      count: number;
    };

    if (staffCount.count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Staff@2026!', salt);
      const now = new Date().toISOString();

      this.db
        .prepare(`
        INSERT INTO users (
          id, personal_code, full_name, phone, email, password_hash,
          city, local_address, nearest_point, role, preferred_language,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .run(
          crypto.randomUUID(),
          'STF-0001',
          'Guangzhou Warehouse Staff',
          '07700000002',
          'staff@dante.com',
          hash,
          'Baghdad',
          'Warehouse Branch',
          'Mansour Mall',
          'staff',
          'en',
          now,
          now
        );
    }
  }
}
