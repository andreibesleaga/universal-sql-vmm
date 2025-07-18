const { expect } = require('chai');
const { validateSql, validateAdapter, validateOptions, validateRequest } = require('../../../utils/validator');
const { AppError } = require('../../../utils/errorHandler');

describe('Validator', () => {
  describe('validateSql', () => {
    it('should accept valid SQL', () => {
      expect(() => validateSql('SELECT * FROM users')).to.not.throw();
      expect(() => validateSql('INSERT INTO users (name) VALUES ("test")')).to.not.throw();
    });

    it('should reject empty SQL', () => {
      expect(() => validateSql('')).to.throw(AppError);
      expect(() => validateSql(null)).to.throw(AppError);
      expect(() => validateSql(undefined)).to.throw(AppError);
    });

    it('should reject non-string SQL', () => {
      expect(() => validateSql(123)).to.throw(AppError);
      expect(() => validateSql({})).to.throw(AppError);
      expect(() => validateSql([])).to.throw(AppError);
    });

    it('should detect SQL injection patterns when not in test mode', () => {
      // Save original TEST_MODE
      const originalTestMode = process.env.TEST_MODE;
      process.env.TEST_MODE = 'false';

      expect(() => validateSql("SELECT * FROM users; DROP TABLE users;")).to.throw(AppError);
      expect(() => validateSql("SELECT * FROM users WHERE id = 1 OR 1=1")).to.throw(AppError);
      expect(() => validateSql("SELECT * FROM users UNION ALL SELECT username, password FROM users")).to.throw(AppError);

      // Restore TEST_MODE
      process.env.TEST_MODE = originalTestMode;
    });

    it('should allow SQL injection patterns in test mode', () => {
      // Save original TEST_MODE
      const originalTestMode = process.env.TEST_MODE;
      process.env.TEST_MODE = 'true';

      expect(() => validateSql("SELECT * FROM users; DROP TABLE users;")).to.not.throw();

      // Restore TEST_MODE
      process.env.TEST_MODE = originalTestMode;
    });
  });

  describe('validateAdapter', () => {
    it('should accept valid adapters', () => {
      expect(() => validateAdapter('database')).to.not.throw();
      expect(() => validateAdapter('sqlite')).to.not.throw();
      expect(() => validateAdapter('redis')).to.not.throw();
      expect(() => validateAdapter('kafka')).to.not.throw();
      expect(() => validateAdapter('ethereum')).to.not.throw();
      expect(() => validateAdapter('hyperledger')).to.not.throw();
      expect(() => validateAdapter('hedera')).to.not.throw();
    });

    it('should accept valid adapters with different case', () => {
      expect(() => validateAdapter('DATABASE')).to.not.throw();
      expect(() => validateAdapter('Redis')).to.not.throw();
    });

    it('should reject invalid adapters', () => {
      expect(() => validateAdapter('invalid')).to.throw(AppError);
      expect(() => validateAdapter('')).to.throw(AppError);
      expect(() => validateAdapter(null)).to.throw(AppError);
      expect(() => validateAdapter(undefined)).to.throw(AppError);
    });

    it('should reject non-string adapters', () => {
      expect(() => validateAdapter(123)).to.throw(AppError);
      expect(() => validateAdapter({})).to.throw(AppError);
      expect(() => validateAdapter([])).to.throw(AppError);
    });
  });

  describe('validateOptions', () => {
    it('should accept valid options', () => {
      expect(() => validateOptions({ timeout: 5000 })).to.not.throw();
      expect(() => validateOptions({})).to.not.throw();
      expect(() => validateOptions(null)).to.not.throw();
      expect(() => validateOptions(undefined)).to.not.throw();
    });

    it('should reject non-object options', () => {
      expect(() => validateOptions('string')).to.throw(AppError);
      expect(() => validateOptions(123)).to.throw(AppError);
    });

    it('should reject invalid timeout', () => {
      expect(() => validateOptions({ timeout: -1 })).to.throw(AppError);
      expect(() => validateOptions({ timeout: 'string' })).to.throw(AppError);
      expect(() => validateOptions({ timeout: 1.5 })).to.throw(AppError);
    });
  });

  describe('validateRequest', () => {
    it('should validate complete request', () => {
      expect(() => validateRequest({
        sql: 'SELECT * FROM users',
        adapter: 'database',
        options: { timeout: 5000 }
      })).to.not.throw();
    });

    it('should validate request without options', () => {
      expect(() => validateRequest({
        sql: 'SELECT * FROM users',
        adapter: 'database'
      })).to.not.throw();
    });

    it('should reject request with invalid SQL', () => {
      expect(() => validateRequest({
        sql: '',
        adapter: 'database'
      })).to.throw(AppError);
    });

    it('should reject request with invalid adapter', () => {
      expect(() => validateRequest({
        sql: 'SELECT * FROM users',
        adapter: 'invalid'
      })).to.throw(AppError);
    });

    it('should reject request with invalid options', () => {
      expect(() => validateRequest({
        sql: 'SELECT * FROM users',
        adapter: 'database',
        options: { timeout: -1 }
      })).to.throw(AppError);
    });
  });
});