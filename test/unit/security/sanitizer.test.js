const { expect } = require('chai');
const { sanitizeSql, sanitizeObject, sanitizeRequest } = require('../../../security/sanitizer');
const { AppError } = require('../../../utils/errorHandler');

describe('Sanitizer', () => {
  describe('sanitizeSql', () => {
    it('should remove comments from SQL', () => {
      const sql = "SELECT * FROM users; -- This is a comment";
      expect(sanitizeSql(sql)).to.equal("SELECT * FROM users;");
      
      const multilineComment = "SELECT * FROM users /* This is a\nmultiline comment */ WHERE id = 1";
      expect(sanitizeSql(multilineComment)).to.equal("SELECT * FROM users WHERE id = 1");
    });

    it('should normalize whitespace', () => {
      const sql = "SELECT   *   FROM\n\nusers\t\tWHERE\nid = 1";
      expect(sanitizeSql(sql)).to.equal("SELECT * FROM users WHERE id = 1");
    });

    it('should reject invalid input', () => {
      expect(() => sanitizeSql('')).to.throw(AppError);
      expect(() => sanitizeSql(null)).to.throw(AppError);
      expect(() => sanitizeSql(123)).to.throw(AppError);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values to prevent XSS', () => {
      const obj = {
        name: '<script>alert("XSS")</script>',
        description: "Text with <tags> and \"quotes\""
      };
      
      const sanitized = sanitizeObject(obj);
      expect(sanitized.name).to.equal('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(sanitized.description).to.equal('Text with &lt;tags&gt; and &quot;quotes&quot;');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: '<b>Name</b>',
          profile: {
            bio: "<p>Bio</p>"
          }
        }
      };
      
      const sanitized = sanitizeObject(obj);
      expect(sanitized.user.name).to.equal('&lt;b&gt;Name&lt;&#x2F;b&gt;');
      expect(sanitized.user.profile.bio).to.equal('&lt;p&gt;Bio&lt;&#x2F;p&gt;');
    });

    it('should preserve non-string values', () => {
      const obj = {
        id: 123,
        active: true,
        price: 99.99,
        tags: ['tag1', 'tag2']
      };
      
      const sanitized = sanitizeObject(obj);
      expect(sanitized.id).to.equal(123);
      expect(sanitized.active).to.equal(true);
      expect(sanitized.price).to.equal(99.99);
      expect(sanitized.tags).to.deep.equal(['tag1', 'tag2']);
    });

    it('should handle non-object input', () => {
      expect(sanitizeObject('string')).to.equal('string');
      expect(sanitizeObject(123)).to.equal(123);
      expect(sanitizeObject(null)).to.equal(null);
      expect(sanitizeObject(undefined)).to.equal(undefined);
    });
  });

  describe('sanitizeRequest', () => {
    it('should sanitize complete request', () => {
      const request = {
        sql: "SELECT * FROM users -- Comment",
        adapter: "DATABASE",
        options: { description: "<script>alert('XSS')</script>" }
      };
      
      const sanitized = sanitizeRequest(request);
      expect(sanitized.sql).to.equal("SELECT * FROM users");
      expect(sanitized.adapter).to.equal("database");
      expect(sanitized.options.description).to.equal("&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;&#x2F;script&gt;");
    });

    it('should handle request without options', () => {
      const request = {
        sql: "SELECT * FROM users",
        adapter: "database"
      };
      
      const sanitized = sanitizeRequest(request);
      expect(sanitized.sql).to.equal("SELECT * FROM users");
      expect(sanitized.adapter).to.equal("database");
      expect(sanitized.options).to.deep.equal({});
    });
  });
});